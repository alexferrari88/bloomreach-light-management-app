// client/src/types/index.ts

// Common Types
export interface ApiRequest {
  brxHost: string;
  authToken: string;
  section: "contentTypes" | "components";
  operation: string;
  resourceId?: string;
  resourceData?: any;
  contentTypeMode?: "core" | "development";
  channelId?: string;
  componentGroup?: string;
}

export interface ApiResponse {
  success: boolean;
  data?: any;
  resourceVersion?: string;
  error?: string;
  details?: any;
}

export interface QueuedOperation {
  id: string; // Unique ID for this operation
  timestamp: string; // When it was queued
  operation: ApiRequest; // The operation to perform
  type: "CREATE" | "UPDATE" | "DELETE"; // Operation type
  entityType: string; // Content Type, Component, etc.
  entityName: string; // Name/ID of the entity
  originalData?: any; // Original state (for updates/deletes)
  description: string; // Human-readable description
  dependencies?: string[]; // IDs of operations this depends on
  status: "PENDING" | "EXECUTED" | "FAILED"; // Current status
  error?: string; // Error message if failed
}

export interface QueueState {
  operations: QueuedOperation[];
  isQueueMode: boolean; // Whether queue mode is active
  originalStates: Record<string, any>; // Original states of resources before editing
}

// API context interface
export interface ApiContextType {
  queueState: QueueState;
  toggleQueueMode: () => void;
  queueOperation: (
    operation: ApiRequest,
    type: "CREATE" | "UPDATE" | "DELETE",
    entityType: string,
    entityName: string,
    description: string,
    originalData?: any
  ) => Promise<any>;
  executeOperation: (operation: ApiRequest) => Promise<ApiResponse>;
  executeQueue: () => Promise<void>;
  clearQueue: () => void;
  discardOperation: (id: string) => void;
}

export interface Auth {
  brxHost: string;
  authToken: string;
}

// Content Type Management Types
export interface ContentType {
  id?: string;
  name: string;
  displayName?: string;
  description?: string;
  properties: Property[];
  resourceVersion?: string;
}

export interface Property {
  name: string;
  displayName?: string;
  type:
    | "String"
    | "Text"
    | "Html"
    | "Boolean"
    | "Long"
    | "Double"
    | "Date"
    | "Link"
    | "Image"
    | "Reference";
  multiple?: boolean;
  required?: boolean;
}

// Component Management Types
export interface ComponentGroup {
  name: string;
  hidden: boolean;
  system: boolean;
  resourceVersion?: string;
}

export interface Component {
  id: string;
  extends: string;
  hidden: boolean;
  system: boolean;
  xtype?: string;
  ctype?: string;
  contentType?: string;
  label?: string;
  icon?: string;
  parameters: Parameter[];
  fieldGroups: FieldGroup[];
  resourceVersion?: string;
  name?: string; // Used when extracting name from ID
}

export interface Parameter {
  name: string;
  valueType: "string" | "calendar" | "boolean" | "integer" | "number";
  required: boolean;
  hidden: boolean;
  overlay: boolean;
  defaultValue?: string;
  displayName?: string;
  system: boolean;
  config: ParameterConfig | null;
}

export interface ParameterConfig {
  type: "contentpath" | "dropdown" | "imagesetpath";
  pickerConfiguration?: string;
  pickerInitialPath?: string;
  pickerRememberLastVisited?: boolean;
  pickerSelectableNodeTypes?: string[];
  relative?: boolean;
  sourceId?: string;
  value?: string[];
  previewVariant?: string;
  enableUpload?: boolean;
}

export interface FieldGroup {
  name: string;
  displayName?: string;
  parameters: string[];
}

// Change History Types
export interface Change {
  action: "CREATE" | "UPDATE" | "DELETE";
  entityType: string;
  entityName: string;
  entityData?: any;
  previousData?: any;
  timestamp: string;
}

// React Component Props Types

export interface AuthFormProps {
  onLogin: (credentials: Auth) => void;
}

export interface ContentTypeEditorProps {
  contentType: ContentType | null;
  onSave: (contentType: ContentType) => void;
  onCancel: () => void;
  mode: "core" | "development";
}

export interface ComponentEditorProps {
  component: Component | null;
  onSave: (component: Component) => void;
  onCancel: () => void;
  groupName: string;
}

export interface ContentTypeManagerProps {
  makeApiRequest: (params: ApiRequest) => Promise<ApiResponse>;
}

export interface ComponentManagerProps {
  makeApiRequest: (params: ApiRequest) => Promise<ApiResponse>;
}

export interface ChangeHistoryProps {
  changes: Change[];
  onClear: () => void;
  onDownloadModifiedFiles: () => void;
  onDownloadGitPatch: () => void;
}

export interface ChangeDetailProps {
  change: Change;
  onClose: () => void;
}
