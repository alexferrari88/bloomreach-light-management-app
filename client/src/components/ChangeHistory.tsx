import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FileBadge, GitGraph, Info, Trash2, X } from "lucide-react";
import { useState } from "react";
import { Change, ChangeHistoryProps } from "../types";
import ChangeDetail from "./ChangeDetail";

const ChangeHistory: React.FC<ChangeHistoryProps> = ({
  changes,
  onClear,
  onDownloadModifiedFiles,
  onDownloadGitPatch,
}) => {
  const [selectedChange, setSelectedChange] = useState<Change | null>(null);
  const [downloadDialogOpen, setDownloadDialogOpen] = useState<boolean>(false);

  const handleChangeClick = (change: Change) => {
    setSelectedChange(change);
  };

  // Get unique entities including both modified and deleted ones
  const getUniqueEntities = () => {
    const modifiedMap = new Map();
    const deletedMap = new Map();

    changes.forEach((change) => {
      const key = `${change.entityType}:${change.entityName}`;

      // Check if this is the most recent change for this entity
      const isModified = modifiedMap.has(key);
      const isDeleted = deletedMap.has(key);
      const isMoreRecent =
        (isModified || isDeleted) &&
        (isModified
          ? new Date(change.timestamp) >
            new Date(modifiedMap.get(key).timestamp)
          : new Date(change.timestamp) >
            new Date(deletedMap.get(key).timestamp));

      if ((!isModified && !isDeleted) || isMoreRecent) {
        if (change.action === "DELETE") {
          deletedMap.set(key, change);
          modifiedMap.delete(key);
        } else {
          modifiedMap.set(key, change);
          deletedMap.delete(key);
        }
      }
    });

    return {
      modified: Array.from(modifiedMap.values()),
      deleted: Array.from(deletedMap.values()),
    };
  };

  const { modified: modifiedEntities, deleted: deletedEntities } =
    getUniqueEntities();

  // Check if we have any entities to export
  const hasChanges = modifiedEntities.length > 0 || deletedEntities.length > 0;

  if (changes.length === 0) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Change History</CardTitle>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" disabled>
              <FileBadge className="mr-2 h-4 w-4" />
              Download Files
            </Button>
            <Button variant="outline" size="sm" disabled>
              <GitGraph className="mr-2 h-4 w-4" />
              Git Patch
            </Button>
            <Button variant="outline" size="sm" disabled>
              <Trash2 className="mr-2 h-4 w-4" />
              Clear
            </Button>
          </div>
        </CardHeader>
        <CardContent className="py-6 text-center text-muted-foreground">
          <p>No changes recorded in this session.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Change History</CardTitle>
        <div className="flex space-x-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setDownloadDialogOpen(true)}
            className="cursor-pointer"
            disabled={!hasChanges}
          >
            <FileBadge className="mr-2 h-4 w-4" />
            Download Files
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onDownloadGitPatch}
            className="cursor-pointer"
            disabled={!hasChanges}
          >
            <GitGraph className="mr-2 h-4 w-4" />
            Git Patch
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClear}
            className="cursor-pointer"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Clear
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="max-h-80 overflow-auto">
          {changes.map((change, index) => (
            <div
              key={index}
              className={`border-b last:border-0 p-3 flex items-center ${
                change.entityData || change.previousData
                  ? "cursor-pointer hover:bg-muted/50"
                  : ""
              }`}
              onClick={() =>
                change.entityData || change.previousData
                  ? handleChangeClick(change)
                  : null
              }
            >
              <div className="flex-shrink-0 text-xs text-muted-foreground w-32">
                {change.timestamp}
              </div>
              <div className="flex items-center gap-3 flex-grow">
                <Badge
                  variant={
                    change.action === "CREATE"
                      ? "default"
                      : change.action === "UPDATE"
                      ? "default"
                      : "destructive"
                  }
                >
                  {change.action}
                </Badge>
                <div className="text-sm">
                  {change.entityType}:{" "}
                  <span className="font-medium">{change.entityName}</span>
                </div>
                {(change.entityData || change.previousData) && (
                  <Info className="h-4 w-4 ml-auto text-primary" />
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>

      {selectedChange && (
        <Dialog
          open={!!selectedChange}
          onOpenChange={(open) => !open && setSelectedChange(null)}
        >
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle className="flex items-center">
                <Badge
                  variant={
                    selectedChange.action === "CREATE"
                      ? "default"
                      : selectedChange.action === "UPDATE"
                      ? "default"
                      : "destructive"
                  }
                  className="mr-2"
                >
                  {selectedChange.action}
                </Badge>
                {selectedChange.entityType}:{" "}
                <span className="font-medium ml-1">
                  {selectedChange.entityName}
                </span>
                <span className="text-xs text-muted-foreground ml-auto mr-6">
                  {selectedChange.timestamp}
                </span>
              </DialogTitle>
              <DialogClose className="absolute right-4 top-4 rounded-sm opacity-70 hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none">
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
              </DialogClose>
            </DialogHeader>
            <div className="overflow-y-auto flex-grow p-4">
              <ChangeDetail
                change={selectedChange}
                onClose={() => setSelectedChange(null)}
              />
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Download Modified Files Dialog */}
      <Dialog open={downloadDialogOpen} onOpenChange={setDownloadDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Download Modified Files</DialogTitle>
          </DialogHeader>

          <div className="py-4">
            <p className="mb-4 text-sm text-muted-foreground">
              The following changes will be included in your download:
            </p>

            {/* Modified Entities Table */}
            {modifiedEntities.length > 0 && (
              <>
                <h3 className="text-sm font-medium mb-2">
                  Files to be Created/Updated:
                </h3>
                <div className="border rounded-md overflow-hidden mb-6">
                  <table className="w-full">
                    <thead className="bg-muted text-sm">
                      <tr>
                        <th className="text-left py-2 px-4 font-medium">
                          File Name
                        </th>
                        <th className="text-left py-2 px-4 font-medium">
                          Type
                        </th>
                        <th className="text-left py-2 px-4 font-medium">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {modifiedEntities.map((entity, index) => (
                        <tr key={index} className="text-sm">
                          <td className="py-2 px-4 font-mono">
                            {entity.entityName}.json
                          </td>
                          <td className="py-2 px-4">{entity.entityType}</td>
                          <td className="py-2 px-4">
                            <Badge
                              variant={
                                entity.action === "CREATE"
                                  ? "default"
                                  : "default"
                              }
                              className="font-normal"
                            >
                              {entity.action}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {/* Deleted Entities Table */}
            {deletedEntities.length > 0 && (
              <>
                <h3 className="text-sm font-medium mb-2">
                  Files to be Deleted:
                </h3>
                <div className="border rounded-md overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-muted text-sm">
                      <tr>
                        <th className="text-left py-2 px-4 font-medium">
                          File Name
                        </th>
                        <th className="text-left py-2 px-4 font-medium">
                          Type
                        </th>
                        <th className="text-left py-2 px-4 font-medium">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {deletedEntities.map((entity, index) => (
                        <tr key={index} className="text-sm">
                          <td className="py-2 px-4 font-mono">
                            {entity.entityName}.json
                          </td>
                          <td className="py-2 px-4">{entity.entityType}</td>
                          <td className="py-2 px-4">
                            <Badge
                              variant="destructive"
                              className="font-normal"
                            >
                              {entity.action}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-md text-amber-800 text-sm">
                  <strong>Note:</strong> Deleted files will be listed in the
                  manifest.md file and can be removed from your git repository
                  using the included apply-changes.sh script.
                </div>
              </>
            )}

            {modifiedEntities.length === 0 && deletedEntities.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No changes to download.
              </div>
            )}

            <div className="mt-6 p-3 bg-blue-50 border border-blue-200 rounded-md text-blue-800 text-sm">
              <strong>Pro Tip:</strong> You can also download a Git patch file
              by clicking the "Git Patch" button. This creates a single file
              that can be applied with{" "}
              <code className="bg-blue-100 px-1 rounded">
                git apply patch_file.patch
              </code>
              in your repository.
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDownloadDialogOpen(false)}
              className="cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => {
                onDownloadModifiedFiles();
                setDownloadDialogOpen(false);
              }}
              className="cursor-pointer"
            >
              <FileBadge className="mr-2 h-4 w-4" />
              Download Files
            </Button>
            <Button
              type="button"
              onClick={() => {
                onDownloadGitPatch();
                setDownloadDialogOpen(false);
              }}
              className="cursor-pointer"
            >
              <GitGraph className="mr-2 h-4 w-4" />
              Download Git Patch
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default ChangeHistory;
