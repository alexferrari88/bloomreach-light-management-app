// client/src/components/OperationQueue.tsx
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  AlertCircle,
  Ban,
  CheckCircle,
  Clock,
  List,
  ListOrdered,
  Play,
  Trash2,
  XCircle,
} from "lucide-react";
import React, { useState } from "react";
import { useApi } from "../contexts/ApiContext";

export const OperationQueue: React.FC = () => {
  const {
    queueState,
    toggleQueueMode,
    executeQueue,
    clearQueue,
    discardOperation,
  } = useApi();

  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [isConfirmClearOpen, setIsConfirmClearOpen] = useState(false);

  const { operations, isQueueMode } = queueState;
  const pendingCount = operations.filter(
    (op) => op.status === "PENDING"
  ).length;
  const failedCount = operations.filter((op) => op.status === "FAILED").length;

  // Get badge variant for operation status
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return (
          <Badge variant="outline" className="flex items-center gap-1">
            <Clock className="h-3 w-3" /> Pending
          </Badge>
        );
      case "EXECUTED":
        return (
          <Badge variant="default" className="flex items-center gap-1">
            <CheckCircle className="h-3 w-3" /> Executed
          </Badge>
        );
      case "FAILED":
        return (
          <Badge variant="destructive" className="flex items-center gap-1">
            <XCircle className="h-3 w-3" /> Failed
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary" className="flex items-center gap-1">
            <AlertCircle className="h-3 w-3" /> Unknown
          </Badge>
        );
    }
  };

  // Get badge for operation type
  const getTypeBadge = (type: string) => {
    switch (type) {
      case "CREATE":
        return <Badge variant="default">CREATE</Badge>;
      case "UPDATE":
        return <Badge variant="default">UPDATE</Badge>;
      case "DELETE":
        return <Badge variant="destructive">DELETE</Badge>;
      default:
        return <Badge variant="secondary">UNKNOWN</Badge>;
    }
  };

  // Format timestamp to readable format
  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  return (
    <>
      <Card className="mb-6">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <ListOrdered className="h-4 w-4" />
            Operation Queue
            {pendingCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {pendingCount} pending
              </Badge>
            )}
            {failedCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                {failedCount} failed
              </Badge>
            )}
          </CardTitle>
          <div className="flex space-x-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={isQueueMode ? "default" : "outline"}
                    size="sm"
                    onClick={toggleQueueMode}
                    className="cursor-pointer"
                  >
                    {isQueueMode ? (
                      <>
                        <ListOrdered className="mr-2 h-4 w-4" /> Queue Mode
                      </>
                    ) : (
                      <>
                        <Play className="mr-2 h-4 w-4" /> Immediate
                      </>
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {isQueueMode
                    ? "Queue Mode: Changes will be queued for review"
                    : "Immediate Mode: Changes will be applied immediately"}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {isQueueMode && operations.length > 0 && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsReviewOpen(true)}
                  className="cursor-pointer"
                >
                  <List className="mr-2 h-4 w-4" /> Review ({operations.length})
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsConfirmClearOpen(true)}
                  className="cursor-pointer"
                >
                  <Trash2 className="mr-2 h-4 w-4" /> Clear
                </Button>

                <Button
                  variant="default"
                  size="sm"
                  onClick={executeQueue}
                  disabled={pendingCount === 0}
                  className="cursor-pointer"
                >
                  <Play className="mr-2 h-4 w-4" /> Execute
                </Button>
              </>
            )}
          </div>
        </CardHeader>

        {isQueueMode && (
          <CardContent className="pt-2">
            {operations.length === 0 ? (
              <div className="py-4 text-center text-muted-foreground">
                <p>
                  No operations in queue. Make changes to add them to the queue.
                </p>
              </div>
            ) : (
              <div className="overflow-auto max-h-32">
                {operations.slice(0, 3).map((op) => (
                  <div
                    key={op.id}
                    className="flex items-center justify-between py-2 border-b last:border-0"
                  >
                    <div className="flex items-center gap-2">
                      {getTypeBadge(op.type)}
                      <span className="font-medium">{op.entityType}:</span>
                      <span>{op.entityName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(op.status)}
                      <span className="text-xs text-muted-foreground">
                        {formatTimestamp(op.timestamp)}
                      </span>
                    </div>
                  </div>
                ))}

                {operations.length > 3 && (
                  <div className="text-center mt-2">
                    <Button
                      variant="link"
                      size="sm"
                      onClick={() => setIsReviewOpen(true)}
                      className="cursor-pointer"
                    >
                      View all {operations.length} operations
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {/* Review Queue Dialog */}
      <Dialog open={isReviewOpen} onOpenChange={setIsReviewOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Review Operations Queue</DialogTitle>
            <DialogDescription>
              Review and manage operations before executing them
            </DialogDescription>
          </DialogHeader>

          <div className="overflow-y-auto flex-1 my-4">
            {operations.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                <p>No operations in queue</p>
              </div>
            ) : (
              <div className="border rounded-md overflow-hidden">
                <table className="w-full">
                  <thead className="bg-muted">
                    <tr>
                      <th className="text-left p-2 font-medium">Type</th>
                      <th className="text-left p-2 font-medium">Entity</th>
                      <th className="text-left p-2 font-medium">Description</th>
                      <th className="text-left p-2 font-medium">Time</th>
                      <th className="text-left p-2 font-medium">Status</th>
                      <th className="text-right p-2 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {operations.map((op) => (
                      <tr
                        key={op.id}
                        className={`${
                          op.status === "FAILED"
                            ? "bg-red-50 dark:bg-red-900/10"
                            : ""
                        }`}
                      >
                        <td className="p-2">{getTypeBadge(op.type)}</td>
                        <td className="p-2">
                          <div className="font-medium">{op.entityType}</div>
                          <div className="text-sm text-muted-foreground">
                            {op.entityName}
                          </div>
                        </td>
                        <td className="p-2">{op.description}</td>
                        <td className="p-2 text-sm">
                          {formatTimestamp(op.timestamp)}
                        </td>
                        <td className="p-2">{getStatusBadge(op.status)}</td>
                        <td className="p-2 text-right">
                          {op.status === "PENDING" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => discardOperation(op.id)}
                              className="cursor-pointer"
                            >
                              <Ban className="h-4 w-4" />
                              <span className="sr-only">Discard</span>
                            </Button>
                          )}
                          {op.status === "FAILED" && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="text-xs text-red-500 font-mono">
                                    {op.error}
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent>{op.error}</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <DialogFooter className="flex justify-between items-center">
            <div>
              <Button
                variant="outline"
                onClick={() => setIsConfirmClearOpen(true)}
                className="cursor-pointer"
              >
                <Trash2 className="mr-2 h-4 w-4" /> Clear Queue
              </Button>
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={() => setIsReviewOpen(false)}
                className="cursor-pointer"
              >
                Close
              </Button>
              <Button
                variant="default"
                onClick={() => {
                  executeQueue();
                  setIsReviewOpen(false);
                }}
                disabled={pendingCount === 0}
                className="cursor-pointer"
              >
                <Play className="mr-2 h-4 w-4" /> Execute Queue
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Clear Dialog */}
      <Dialog open={isConfirmClearOpen} onOpenChange={setIsConfirmClearOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Clear Operation Queue</DialogTitle>
            <DialogDescription>
              Are you sure you want to clear all operations from the queue? This
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button
              variant="outline"
              onClick={() => setIsConfirmClearOpen(false)}
              className="cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                clearQueue();
                setIsConfirmClearOpen(false);
                setIsReviewOpen(false);
              }}
              className="cursor-pointer"
            >
              <Trash2 className="mr-2 h-4 w-4" /> Clear Queue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default OperationQueue;
