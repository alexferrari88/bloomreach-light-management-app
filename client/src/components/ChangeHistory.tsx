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
import { Download, Info, Trash2, X } from "lucide-react";
import { useState } from "react";
import { Change, ChangeHistoryProps } from "../types";
import ChangeDetail from "./ChangeDetail";

const ChangeHistory: React.FC<ChangeHistoryProps> = ({
  changes,
  onClear,
  onExport,
}) => {
  const [selectedChange, setSelectedChange] = useState<Change | null>(null);

  const handleChangeClick = (change: Change) => {
    setSelectedChange(change);
  };

  if (changes.length === 0) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Change History</CardTitle>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" disabled>
              <Download className="mr-2 h-4 w-4" />
              Export
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
            variant="secondary"
            size="sm"
            onClick={onExport}
            className="cursor-pointer"
          >
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button
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
                      ? "success"
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
                      ? "success"
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
    </Card>
  );
};

export default ChangeHistory;
