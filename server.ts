// server.ts
import axios, { AxiosRequestConfig, AxiosResponse } from "axios";
import cors from "cors";
import express, { Request, Response } from "express";
import path from "path";

// Define interface for API request
interface BloomreachApiRequest {
  brxHost: string;
  authToken: string;
  section: string;
  operation: string;
  resourceId?: string;
  resourceData?: any;
  contentTypeMode?: "core" | "development";
  channelId?: string;
  componentGroup?: string;
}

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(express.json());
app.use(cors());
app.use(express.static(path.join(__dirname, "client/build")));

// API proxy for Bloomreach
app.post("/api/execute", async (req: Request, res: Response) => {
  try {
    const {
      brxHost,
      authToken,
      section,
      operation,
      resourceId,
      resourceData,
      contentTypeMode,
      channelId,
      componentGroup,
    } = req.body as BloomreachApiRequest;

    // Validate required fields
    if (!brxHost || !authToken) {
      return res
        .status(400)
        .json({ success: false, error: "Missing authentication details" });
    }

    // Construct API URL based on section and operation
    let apiUrl: string;
    let method: string = "GET";
    let data: any = null;
    let headers: Record<string, string> = {
      "Content-Type": "application/json",
      "x-auth-token": authToken,
    };

    // Handle Content Type operations
    if (section === "contentTypes") {
      // Base URL depends on mode (core or development)
      const baseUrl = `${brxHost}/management/contenttypes/v1/${contentTypeMode}`;

      switch (operation) {
        case "get":
          apiUrl = baseUrl;
          break;
        case "getById":
          if (!resourceId)
            return res
              .status(400)
              .json({ success: false, error: "Resource ID is required" });
          // if resourceId is "group:name", then it should become "group-name"
          const resourcePath = resourceId.replace(":", "-");
          apiUrl = `${baseUrl}/${resourcePath}`;
          break;
        case "create":
          apiUrl = baseUrl;
          method = "POST";
          data = resourceData;
          break;
        case "update":
          if (!resourceId)
            return res
              .status(400)
              .json({ success: false, error: "Resource ID is required" });
          if (resourceData.resourceVersion) {
            headers["X-Resource-Version"] = resourceData.resourceVersion;
            delete resourceData.resourceVersion;
          }
          apiUrl = `${baseUrl}/${resourceId}`;
          method = "PUT";
          data = resourceData;
          break;
        case "delete":
          if (!resourceId)
            return res
              .status(400)
              .json({ success: false, error: "Resource ID is required" });
          apiUrl = `${baseUrl}/${resourceId}`;
          method = "DELETE";
          break;
        default:
          return res
            .status(400)
            .json({ success: false, error: "Invalid operation" });
      }
    }
    // Handle Component operations
    else if (section === "components") {
      if (!channelId) {
        return res
          .status(400)
          .json({ success: false, error: "Channel ID is required" });
      }

      const baseUrl = `${brxHost}/management/site/v1/channels/${channelId}`;

      switch (operation) {
        case "getGroups":
          apiUrl = `${baseUrl}/component_groups`;
          break;
        case "getGroup":
          if (!componentGroup)
            return res
              .status(400)
              .json({ success: false, error: "Component group is required" });
          apiUrl = `${baseUrl}/component_groups/${componentGroup}`;
          break;
        case "getComponents":
          if (!componentGroup)
            return res
              .status(400)
              .json({ success: false, error: "Component group is required" });
          apiUrl = `${baseUrl}/component_groups/${componentGroup}/components`;
          break;
        case "getComponent":
          if (!componentGroup || !resourceId) {
            return res.status(400).json({
              success: false,
              error: "Component group and component name are required",
            });
          }
          apiUrl = `${baseUrl}/component_groups/${componentGroup}/components/${resourceId}`;
          break;
        case "createGroup":
          if (!componentGroup)
            return res
              .status(400)
              .json({ success: false, error: "Component group is required" });
          apiUrl = `${baseUrl}/component_groups/${componentGroup}`;
          method = "PUT";
          data = {
            name: componentGroup,
            hidden: false,
            system: false,
            ...resourceData,
          };
          break;
        case "updateGroup":
          if (!componentGroup)
            return res
              .status(400)
              .json({ success: false, error: "Component group is required" });
          if (resourceData && resourceData.resourceVersion) {
            headers["X-Resource-Version"] = resourceData.resourceVersion;
            delete resourceData.resourceVersion;
          }
          apiUrl = `${baseUrl}/component_groups/${componentGroup}`;
          method = "PUT";
          data = { name: componentGroup, ...resourceData };
          break;
        case "deleteGroup":
          if (!componentGroup)
            return res
              .status(400)
              .json({ success: false, error: "Component group is required" });
          apiUrl = `${baseUrl}/component_groups/${componentGroup}`;
          method = "DELETE";
          break;
        case "createComponent":
          if (!componentGroup || !resourceId) {
            return res.status(400).json({
              success: false,
              error: "Component group and component name are required",
            });
          }
          apiUrl = `${baseUrl}/component_groups/${componentGroup}/components/${resourceId}`;
          method = "PUT";
          data = resourceData;
          break;
        case "updateComponent":
          if (!componentGroup || !resourceId) {
            return res.status(400).json({
              success: false,
              error: "Component group and component name are required",
            });
          }
          if (resourceData && resourceData.resourceVersion) {
            headers["X-Resource-Version"] = resourceData.resourceVersion;
            delete resourceData.resourceVersion;
          }
          apiUrl = `${baseUrl}/component_groups/${componentGroup}/components/${resourceId}`;
          method = "PUT";
          data = resourceData;
          break;
        case "deleteComponent":
          if (!componentGroup || !resourceId) {
            return res.status(400).json({
              success: false,
              error: "Component group and component name are required",
            });
          }
          apiUrl = `${baseUrl}/component_groups/${componentGroup}/components/${resourceId}`;
          method = "DELETE";
          break;
        default:
          return res
            .status(400)
            .json({ success: false, error: "Invalid operation" });
      }
    } else {
      return res.status(400).json({ success: false, error: "Invalid section" });
    }

    // Make the request to Bloomreach API
    console.log(`Making ${method} request to ${apiUrl}`);
    const axiosConfig: AxiosRequestConfig = {
      method: method as any,
      url: apiUrl,
      headers,
      data,
    };

    const response: AxiosResponse = await axios(axiosConfig);

    // Return the response data and resource version if available
    const result = {
      success: true,
      data: response.data,
      resourceVersion: response.headers["x-resource-version"],
    };

    res.json(result);
  } catch (error: any) {
    console.error("API Error:", error.response?.data || error.message);

    // Format and return error response
    res.status(error.response?.status || 500).json({
      success: false,
      error: error.response?.data?.message || error.message,
      details: error.response?.data,
    });
  }
});

// Serve frontend in production
if (process.env.NODE_ENV === "production") {
  app.get("*", (req: Request, res: Response) => {
    res.sendFile(path.join(__dirname, "client/build", "index.html"));
  });
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
