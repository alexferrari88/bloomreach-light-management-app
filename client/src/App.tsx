import { useEffect, useState } from "react";
import axios from "axios";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Toaster } from "@/components/ui-providers/toast-provider";
import AuthForm from "./components/AuthForm";
import ComponentManager from "./components/ComponentManager";
import ContentTypeManager from "./components/ContentTypeManager";
import ChangeHistory from "./components/ChangeHistory";
import { ApiRequest, ApiResponse, Auth, Change } from "./types";
import { LogOut } from "lucide-react";

function App() {
  // State for authentication
  const [auth, setAuth] = useState<Auth>({
    brxHost: "",
    authToken: "",
  });
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  // State for app navigation
  const [activeSection, setActiveSection] = useState<"contentTypes" | "components">("contentTypes");
  
  // State for change history
  const [changes, setChanges] = useState<Change[]>([]);
  
  // We're using Sonner directly now, no need for a hook

  // Load auth from local storage
  useEffect(() => {
    const savedAuth = localStorage.getItem("brxAuth");
    if (savedAuth) {
      const parsedAuth: Auth = JSON.parse(savedAuth);
      if (parsedAuth.brxHost && parsedAuth.authToken) {
        setAuth(parsedAuth);
        setIsAuthenticated(true);
      }
    }
  }, []);

  // Handle login
  const handleLogin = (credentials: Auth) => {
    localStorage.setItem("brxAuth", JSON.stringify(credentials));
    setAuth(credentials);
    setIsAuthenticated(true);
    toast.success("Authentication details saved!");
  };

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem("brxAuth");
    setAuth({ brxHost: "", authToken: "" });
    setIsAuthenticated(false);
    setChanges([]); // Clear the change history on logout
    toast.info("Logged out successfully");
  };
  
  // Record a change to the history with detailed information
  const recordChange = (
    action: "CREATE" | "UPDATE" | "DELETE", 
    entityType: string, 
    entityName: string, 
    entityData: any = null, 
    previousData: any = null
  ) => {
    const change: Change = {
      action,
      entityType,
      entityName,
      entityData,
      previousData,
      timestamp: new Date().toLocaleString()
    };
    
    setChanges(prevChanges => [change, ...prevChanges]); // Add new changes at the beginning
  };
  
  // Export change history as JSON
  const exportChangeHistory = () => {
    const dataStr = "data:text/json;charset=utf-8," + 
      encodeURIComponent(JSON.stringify(changes, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "change-history.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    
    toast.success("Change history exported successfully");
  };
  
  // Clear change history
  const clearChangeHistory = () => {
    if (window.confirm('Are you sure you want to clear the change history?')) {
      setChanges([]);
      toast({
        title: "History cleared",
        description: "Change history has been cleared",
        duration: 3000,
      });
    }
  };

  // API request handler with detailed change tracking
  const makeApiRequest = async (params: ApiRequest): Promise<ApiResponse> => {
    try {
      // For update and delete operations, fetch the current state first
      let previousData = null;
      
      if (['update', 'updateGroup', 'updateComponent', 'delete', 'deleteGroup', 'deleteComponent'].includes(params.operation)) {
        try {
          // Determine the get operation based on the current operation
          let getOperation: string;
          if (params.operation.includes('Group')) {
            getOperation = 'getGroup';
          } else if (params.operation.includes('Component') && !params.operation.includes('Group')) {
            getOperation = 'getComponent';
          } else {
            getOperation = 'getById';
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
          console.warn('Could not fetch previous state:', error);
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
      if (['create', 'update', 'delete', 'createGroup', 'updateGroup', 'deleteGroup',
           'createComponent', 'updateComponent', 'deleteComponent'].includes(params.operation)) {
        let action: "CREATE" | "UPDATE" | "DELETE" = "CREATE";
        if (params.operation.startsWith('create')) action = 'CREATE';
        else if (params.operation.startsWith('update')) action = 'UPDATE';
        else if (params.operation.startsWith('delete')) action = 'DELETE';
        
        let entityType: string = '';
        if (params.section === 'contentTypes') {
          entityType = 'Content Type';
        } else if (params.operation.includes('Group')) {
          entityType = 'Component Group';
        } else {
          entityType = 'Component';
        }
        
        // Get entity name
        let entityName: string = params.resourceId || '';
        if (params.operation.includes('Group') && params.componentGroup) {
          entityName = params.componentGroup;
        }
        
        // Store the entity data for creates and updates
        const entityData = ['CREATE', 'UPDATE'].includes(action) ? 
          (params.resourceData || response.data.data) : null;
        
        recordChange(action, entityType, entityName, entityData, previousData);
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
  };

  return (
    <div className="min-h-screen bg-background">
      <Toaster />

      {!isAuthenticated ? (
        <AuthForm onLogin={handleLogin} />
      ) : (
        <div className="flex flex-col min-h-screen">
          <header className="border-b bg-card py-4 px-6 flex justify-between items-center">
            <h1 className="text-xl font-semibold text-primary">Bloomreach Management App</h1>
            <div className="flex items-center gap-4">
              <span className="text-muted-foreground text-sm">{auth.brxHost}</span>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </div>
          </header>

          <main className="flex-1 flex flex-col">
            <Tabs 
              value={activeSection} 
              onValueChange={(value: string) => setActiveSection(value as "contentTypes" | "components")}
              className="w-full"
            >
              <div className="border-b bg-card">
                <div className="container mx-auto">
                  <TabsList className="h-12">
                    <TabsTrigger value="contentTypes" className="flex-1">Content Types</TabsTrigger>
                    <TabsTrigger value="components" className="flex-1">Components</TabsTrigger>
                  </TabsList>
                </div>
              </div>
              
              <div className="flex-1 overflow-auto">
                <TabsContent value="contentTypes" className="mt-0 h-full">
                  <ContentTypeManager makeApiRequest={makeApiRequest} />
                </TabsContent>
                <TabsContent value="components" className="mt-0 h-full">
                  <ComponentManager makeApiRequest={makeApiRequest} />
                </TabsContent>
                
                <div className="container mx-auto px-6 pb-6">
                  <ChangeHistory 
                    changes={changes} 
                    onClear={clearChangeHistory} 
                    onExport={exportChangeHistory} 
                  />
                </div>
              </div>
            </Tabs>
          </main>
        </div>
      )}
    </div>
  );
}

export default App;
