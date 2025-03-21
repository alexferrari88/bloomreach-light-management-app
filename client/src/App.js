// src/App.js
import axios from "axios";
import React, { useEffect, useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./App.css";
import AuthForm from "./components/AuthForm";
import ChangeHistory from "./components/ChangeHistory";
import ComponentManager from "./components/ComponentManager";
import ContentTypeManager from "./components/ContentTypeManager";

function App() {
  // State for authentication
  const [auth, setAuth] = useState({
    brxHost: "",
    authToken: "",
  });
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // State for app navigation
  const [activeSection, setActiveSection] = useState("contentTypes");

  // State for change history
  const [changes, setChanges] = useState([]);

  // Load auth from local storage
  useEffect(() => {
    const savedAuth = JSON.parse(localStorage.getItem("brxAuth"));
    if (savedAuth && savedAuth.brxHost && savedAuth.authToken) {
      setAuth(savedAuth);
      setIsAuthenticated(true);
    }
  }, []);

  // Handle login
  const handleLogin = (credentials) => {
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
  const switchSection = (section) => {
    setActiveSection(section);
  };

  // Record a change to the history
  const recordChange = (action, entityType, entityName) => {
    const change = {
      action,
      entityType,
      entityName,
      timestamp: new Date().toLocaleString(),
    };

    setChanges((prevChanges) => [change, ...prevChanges]); // Add new changes at the beginning
  };

  // Export change history as JSON
  const exportChangeHistory = () => {
    const dataStr =
      "data:text/json;charset=utf-8," +
      encodeURIComponent(JSON.stringify(changes, null, 2));
    const downloadAnchorNode = document.createElement("a");
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "change-history.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();

    toast.success("Change history exported successfully");
  };

  // Clear change history
  const clearChangeHistory = () => {
    if (window.confirm("Are you sure you want to clear the change history?")) {
      setChanges([]);
      toast.info("Change history cleared");
    }
  };

  // API request handler with change tracking
  const makeApiRequest = async (params) => {
    try {
      const response = await axios.post("/api/execute", {
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
        let action = params.operation;
        if (action.startsWith("create")) action = "CREATE";
        else if (action.startsWith("update")) action = "UPDATE";
        else if (action.startsWith("delete")) action = "DELETE";

        let entityType = "";
        if (params.section === "contentTypes") {
          entityType = "Content Type";
        } else if (params.operation.includes("Group")) {
          entityType = "Component Group";
        } else {
          entityType = "Component";
        }

        // Get entity name
        let entityName = params.resourceId || "";
        if (params.operation.includes("Group") && params.componentGroup) {
          entityName = params.componentGroup;
        }

        recordChange(action, entityType, entityName);
      }

      return response.data;
    } catch (error) {
      const errorMsg =
        `${error.response?.data?.error}: ${error.response?.data.details}` ||
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
