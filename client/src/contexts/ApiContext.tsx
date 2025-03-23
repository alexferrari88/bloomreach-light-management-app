// client/src/contexts/ApiContext.tsx
import axios from "axios";
import React, { createContext, useCallback, useContext, useState } from "react";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import {
  ApiContextType,
  ApiRequest,
  ApiResponse,
  QueuedOperation,
  QueueState,
} from "../types";

// Create context
export const ApiContext = createContext<ApiContextType | undefined>(undefined);

interface ApiProviderProps {
  children: React.ReactNode;
  auth: {
    brxHost: string;
    authToken: string;
  };
  recordChange: (
    action: "CREATE" | "UPDATE" | "DELETE",
    entityType: string,
    entityName: string,
    entityData?: any,
    previousData?: any
  ) => void;
}

export const ApiProvider: React.FC<ApiProviderProps> = ({
  children,
  auth,
  recordChange,
}) => {
  // Initialize queue state
  const [queueState, setQueueState] = useState<QueueState>({
    operations: [],
    isQueueMode: false,
    originalStates: {},
  });

  // Toggle between immediate execution and queue mode
  const toggleQueueMode = useCallback(() => {
    setQueueState((prev) => {
      // When turning on queue mode, clear the queue
      if (!prev.isQueueMode) {
        return {
          ...prev,
          isQueueMode: true,
          operations: [],
        };
      }
      // When turning off queue mode, we should ask the user if they want to discard changes
      return { ...prev, isQueueMode: false };
    });

    toast.info(
      `${queueState.isQueueMode ? "Immediate" : "Queue"} mode activated`,
      {
        description: queueState.isQueueMode
          ? "Operations will be executed immediately"
          : "Operations will be queued for review before execution",
      }
    );
  }, [queueState.isQueueMode]);

  // Clear the operation queue
  const clearQueue = useCallback(() => {
    setQueueState((prev) => ({
      ...prev,
      operations: [],
    }));
    toast.info("Operation queue cleared");
  }, []);

  // Remove a specific operation from the queue
  const discardOperation = useCallback((id: string) => {
    setQueueState((prev) => ({
      ...prev,
      operations: prev.operations.filter((op) => op.id !== id),
    }));
    toast.info("Operation discarded");
  }, []);

  // Execute a single API operation (the original implementation)
  const executeOperation = useCallback(
    async (params: ApiRequest): Promise<ApiResponse> => {
      try {
        // For update and delete operations, fetch the current state first
        let previousData = null;

        if (
          [
            "update",
            "updateGroup",
            "updateComponent",
            "delete",
            "deleteGroup",
            "deleteComponent",
          ].includes(params.operation)
        ) {
          try {
            // Determine the get operation based on the current operation
            let getOperation: string;
            if (params.operation.includes("Group")) {
              getOperation = "getGroup";
            } else if (
              params.operation.includes("Component") &&
              !params.operation.includes("Group")
            ) {
              getOperation = "getComponent";
            } else {
              getOperation = "getById";
            }

            // Make API request to get current state
            const getResponse = await axios.post<ApiResponse>("/api/execute", {
              ...params,
              operation: getOperation,
              brxHost: auth.brxHost,
              authToken: auth.authToken,
            });

            // Store the current state
            if (getResponse.data.success) {
              previousData = getResponse.data.data;
            }
          } catch (error) {
            console.warn("Could not fetch previous state:", error);
            // Continue with the operation even if we can't get the previous state
          }
        }

        // Now make the actual API request
        const response = await axios.post<ApiResponse>("/api/execute", {
          ...params,
          brxHost: auth.brxHost,
          authToken: auth.authToken,
        });

        // Record the change if it's a mutation operation
        if (
          [
            "create",
            "update",
            "delete",
            "createGroup",
            "updateGroup",
            "deleteGroup",
            "createComponent",
            "updateComponent",
            "deleteComponent",
          ].includes(params.operation)
        ) {
          let action: "CREATE" | "UPDATE" | "DELETE" = "CREATE";
          if (params.operation.startsWith("create")) action = "CREATE";
          else if (params.operation.startsWith("update")) action = "UPDATE";
          else if (params.operation.startsWith("delete")) action = "DELETE";

          let entityType: string = "";
          if (params.section === "contentTypes") {
            entityType = "Content Type";
          } else if (params.operation.includes("Group")) {
            entityType = "Component Group";
          } else {
            entityType = "Component";
          }

          // Get entity name
          let entityName: string = params.resourceId || "";
          if (params.operation.includes("Group") && params.componentGroup) {
            entityName = params.componentGroup;
          }

          // Store the entity data for creates and updates
          const entityData = ["CREATE", "UPDATE"].includes(action)
            ? params.resourceData || response.data.data
            : null;

          recordChange(
            action,
            entityType,
            entityName,
            entityData,
            previousData
          );
        }

        return response.data;
      } catch (error: any) {
        const errorMsg =
          `${error.response?.data?.error}: ${error.response?.data?.details}` ||
          error.message;

        toast.error(errorMsg, {
          duration: 5000,
        });

        throw error;
      }
    },
    [auth.authToken, auth.brxHost, recordChange]
  );

  // Queue an operation instead of executing it immediately
  const queueOperation = useCallback(
    async (
      operation: ApiRequest,
      type: "CREATE" | "UPDATE" | "DELETE",
      entityType: string,
      entityName: string,
      description: string,
      originalData?: any
    ): Promise<any> => {
      // If not in queue mode, execute immediately
      if (!queueState.isQueueMode) {
        return executeOperation(operation);
      }

      // Generate a unique ID for this operation
      const operationId = uuidv4();

      // Create the queued operation
      const queuedOperation: QueuedOperation = {
        id: operationId,
        timestamp: new Date().toISOString(),
        operation,
        type,
        entityType,
        entityName,
        originalData,
        description,
        status: "PENDING",
      };

      // Add to the queue
      setQueueState((prev) => ({
        ...prev,
        operations: [...prev.operations, queuedOperation],
      }));

      // In queue mode, we return a mock successful response
      // This allows the UI to update as if the operation happened
      // The actual operation will be executed later
      return {
        success: true,
        queued: true,
        operationId,
        data: operation.resourceData || { message: "Operation queued" },
      };
    },
    [queueState.isQueueMode, executeOperation]
  );

  // Execute all operations in the queue
  const executeQueue = useCallback(async () => {
    const { operations } = queueState;

    // If queue is empty, do nothing
    if (operations.length === 0) {
      toast.info("No operations to execute");
      return;
    }

    toast.info(`Preparing ${operations.length} queued operations...`);

    // Mark all operations as in progress
    setQueueState((prev) => ({
      ...prev,
      operations: prev.operations.map((op) => ({
        ...op,
        status: "PENDING",
      })),
    }));

    // Step 1: Group operations by target entity
    const operationGroups = new Map<string, QueuedOperation[]>();

    operations.forEach((op) => {
      // Create a unique key for each entity
      const entityKey = `${op.operation.section}:${op.entityType}:${op.entityName}`;

      if (!operationGroups.has(entityKey)) {
        operationGroups.set(entityKey, []);
      }

      operationGroups.get(entityKey)?.push(op);
    });

    // Step 2: For each group, consolidate operations
    const consolidatedOperations: QueuedOperation[] = [];

    for (const [entityKey, ops] of operationGroups.entries()) {
      // If there's only one operation for this entity, no need to consolidate
      if (ops.length === 1) {
        consolidatedOperations.push(ops[0]);
        continue;
      }

      // Sort operations by timestamp (oldest first)
      const sortedOps = [...ops].sort(
        (a, b) =>
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );

      // Check if there's a DELETE operation
      const hasDelete = sortedOps.some((op) => op.type === "DELETE");

      if (hasDelete) {
        // If we have a DELETE, we only need the last DELETE operation
        const lastDelete = [...sortedOps]
          .reverse()
          .find((op) => op.type === "DELETE");
        if (lastDelete) {
          consolidatedOperations.push(lastDelete);
        }
        continue;
      }

      // Check if there's a CREATE operation
      const hasCreate = sortedOps.some((op) => op.type === "CREATE");

      if (hasCreate) {
        // If we have a CREATE followed by UPDATEs, we can consolidate them all into a single CREATE
        // or if we only have CREATEs, use the latest CREATE

        // Get the first CREATE operation
        const firstCreate = sortedOps.find((op) => op.type === "CREATE");

        if (!firstCreate) continue; // Should never happen

        // Start with the base CREATE operation
        const finalOp = { ...firstCreate };
        let finalData = { ...firstCreate.operation.resourceData };

        // Apply all UPDATE operations to the data
        for (const op of sortedOps) {
          if (op.type === "UPDATE" && op.operation.resourceData) {
            // Merge the resource data
            finalData = { ...finalData, ...op.operation.resourceData };
          } else if (op.type === "CREATE" && op.operation.resourceData) {
            // If there are multiple CREATEs, use the latest one's data
            finalData = { ...op.operation.resourceData };
          }
        }

        // Create the consolidated operation
        finalOp.operation = {
          ...finalOp.operation,
          resourceData: finalData,
        };

        finalOp.description = `Combined operation: ${firstCreate.description}`;

        consolidatedOperations.push(finalOp);
        continue;
      }

      // If we only have UPDATE operations
      if (sortedOps.every((op) => op.type === "UPDATE")) {
        // Get the first UPDATE operation as our base
        const firstUpdate = sortedOps[0];

        if (!firstUpdate) continue; // Should never happen

        // Start with the base UPDATE operation
        const finalOp = { ...firstUpdate };

        // If we have the original data (from before any updates), use that as our starting point
        let finalData = finalOp.originalData
          ? { ...finalOp.originalData }
          : finalOp.operation.resourceData
          ? { ...finalOp.operation.resourceData }
          : {};

        // Apply all UPDATE operations sequentially
        for (const op of sortedOps) {
          if (op.operation.resourceData) {
            // For each update, merge its changes into our final data
            finalData = { ...finalData, ...op.operation.resourceData };
          }
        }

        // Create the consolidated operation with the final merged data
        finalOp.operation = {
          ...finalOp.operation,
          resourceData: finalData,
        };

        finalOp.description = `Combined ${sortedOps.length} updates to ${firstUpdate.entityType}: ${firstUpdate.entityName}`;

        consolidatedOperations.push(finalOp);
      }
    }

    // Log the consolidation results
    console.log(
      `Consolidated ${operations.length} operations into ${consolidatedOperations.length} operations`
    );

    // Execute the consolidated operations
    let hadErrors = false;
    const updatedOperations = [...operations];

    toast.info(
      `Executing ${consolidatedOperations.length} consolidated operations...`
    );

    // Track which operations have been handled by our consolidated operations
    const handledOperationIds = new Set<string>();

    // Execute each consolidated operation
    for (const consolidatedOp of consolidatedOperations) {
      try {
        // Find all original operations that are part of this consolidated operation
        const relatedOps = operations.filter(
          (op) =>
            op.operation.section === consolidatedOp.operation.section &&
            op.entityType === consolidatedOp.entityType &&
            op.entityName === consolidatedOp.entityName
        );

        // Add their IDs to the handled set
        relatedOps.forEach((op) => handledOperationIds.add(op.id));

        // Execute the consolidated operation
        await executeOperation(consolidatedOp.operation);

        // Mark all related operations as executed
        for (let i = 0; i < updatedOperations.length; i++) {
          if (relatedOps.some((op) => op.id === updatedOperations[i].id)) {
            updatedOperations[i] = {
              ...updatedOperations[i],
              status: "EXECUTED",
            };
          }
        }

        // Update the queue state
        setQueueState((prev) => ({
          ...prev,
          operations: updatedOperations,
        }));
      } catch (error: any) {
        hadErrors = true;

        // Mark all related operations as failed
        const relatedOps = operations.filter(
          (op) =>
            op.operation.section === consolidatedOp.operation.section &&
            op.entityType === consolidatedOp.entityType &&
            op.entityName === consolidatedOp.entityName &&
            !handledOperationIds.has(op.id)
        );

        for (let i = 0; i < updatedOperations.length; i++) {
          if (relatedOps.some((op) => op.id === updatedOperations[i].id)) {
            updatedOperations[i] = {
              ...updatedOperations[i],
              status: "FAILED",
              error: error.message || "Unknown error",
            };
          }
        }

        // Update the queue state
        setQueueState((prev) => ({
          ...prev,
          operations: updatedOperations,
        }));

        // Show error
        toast.error(
          `Failed to execute operation: ${consolidatedOp.description}`,
          {
            description: error.message || "Unknown error",
            duration: 5000,
          }
        );
      }
    }

    // Show summary toast
    if (hadErrors) {
      toast.error("Some operations failed to execute", {
        description: "Check the queue for details",
        duration: 5000,
      });
    } else {
      toast.success("All operations executed successfully", {
        description: `${operations.length} operations completed`,
        duration: 5000,
      });

      // Clear the queue on success
      setQueueState((prev) => ({
        ...prev,
        operations: [],
        originalStates: {},
      }));
    }
  }, [queueState, executeOperation]);

  // Provide the context
  const contextValue: ApiContextType = {
    queueState,
    toggleQueueMode,
    queueOperation,
    executeOperation,
    executeQueue,
    clearQueue,
    discardOperation,
  };

  return (
    <ApiContext.Provider value={contextValue}>{children}</ApiContext.Provider>
  );
};

// Create a hook to use the API context
export const useApi = () => {
  const context = useContext(ApiContext);
  if (context === undefined) {
    throw new Error("useApi must be used within an ApiProvider");
  }
  return context;
};
