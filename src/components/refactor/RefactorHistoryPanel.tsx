
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RefreshCw, CheckCircle, XCircle, History, Trash2 } from 'lucide-react';
import { useRefactoring } from '@/hooks/useRefactoring';

const RefactorHistoryPanel: React.FC = () => {
  const { refactorHistory, clearHistory } = useRefactoring();

  if (refactorHistory.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Refactoring History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-gray-500 py-8">
            <RefreshCw className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No refactoring operations yet</p>
            <p className="text-sm">Your refactoring history will appear here</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          Refactoring History
        </CardTitle>
        <Button
          variant="outline"
          size="sm"
          onClick={clearHistory}
          className="text-red-600 hover:text-red-700"
        >
          <Trash2 className="h-4 w-4 mr-1" />
          Clear
        </Button>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-64">
          <div className="space-y-3">
            {refactorHistory.map((operation, index) => (
              <div
                key={index}
                className="border rounded-lg p-3 bg-gray-50"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {operation.success ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                    <Badge variant={operation.success ? "default" : "destructive"}>
                      {operation.success ? "Success" : "Failed"}
                    </Badge>
                  </div>
                  <span className="text-xs text-gray-500">
                    #{refactorHistory.length - index}
                  </span>
                </div>
                
                <p className="text-sm font-medium mb-1">{operation.message}</p>
                
                {operation.changes_made && operation.changes_made.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs text-gray-600 mb-1">Changes made:</p>
                    <ul className="text-xs text-gray-500 space-y-0.5">
                      {operation.changes_made.slice(0, 3).map((change, idx) => (
                        <li key={idx} className="flex items-center gap-1">
                          <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                          {change}
                        </li>
                      ))}
                      {operation.changes_made.length > 3 && (
                        <li className="text-gray-400">
                          +{operation.changes_made.length - 3} more changes
                        </li>
                      )}
                    </ul>
                  </div>
                )}
                
                {operation.backup_location && (
                  <p className="text-xs text-blue-600 mt-2">
                    Backup: {operation.backup_location}
                  </p>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default RefactorHistoryPanel;
