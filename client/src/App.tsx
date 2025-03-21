// src/App.tsx
import axios from "axios";
import { useEffect, useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./App.css";
import AuthForm from "./components/AuthForm";
import ComponentManager from "./components/ComponentManager";
import ContentTypeManager from "./components/ContentTypeManager";
import ChangeHistory from "./components/ChangeHistory";
import { 
  ApiRequest, 
  ApiResponse, 
  Auth, 
  Change 
} from "./types";

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

  // Switch between content types and components
  const switchSection = (section: "contentTypes" | "components") => {
    setActiveSection(section);
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
    
    toast.success('Change history exported successfully');
  };
  
  // Clear change history
  const clearChangeHistory = () => {
    if (window.confirm('Are you sure you want to clear the change history?')) {
      setChanges([]);
      toast.info('Change history cleared');
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
      toast.error(`API Error: ${errorMsg}`);
      throw error;
    }
  };

  return (
    <div className="app">
      <ToastContainer position="bottom-right" />

      {!isAuthenticated ? (
        <AuthForm onLogin={handleLogin} />
      ) : (
        <>
          <header className="app-header">
            <h1>Bloomreach Management App</h1>
            <div className="user-info">
              <span>{auth.brxHost}</span>
              <button className="btn btn-outline" onClick={handleLogout}>
                Logout
              </button>
            </div>
          </header>

          <main className="app-main">
            <div className="app-tabs">
              <button
                className={`tab-btn ${
                  activeSection === "contentTypes" ? "active" : ""
                }`}
                onClick={() => switchSection("contentTypes")}
              >
                Content Types
              </button>
              <button
                className={`tab-btn ${
                  activeSection === "components" ? "active" : ""
                }`}
                onClick={() => switchSection("components")}
              >
                Components
              </button>
            </div>

            <div className="app-content">
              {activeSection === "contentTypes" ? (
                <ContentTypeManager makeApiRequest={makeApiRequest} />
              ) : (
                <ComponentManager makeApiRequest={makeApiRequest} />
              )}
              
              <div className="change-history-container">
                <ChangeHistory 
                  changes={changes} 
                  onClear={clearChangeHistory} 
                  onExport={exportChangeHistory} 
                />
              </div>
            </div>
          </main>
        </>
      )}
    </div>
  );
}

export default App;
