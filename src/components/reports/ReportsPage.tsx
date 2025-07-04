
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FileText, Calendar, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ReportDisplay from './ReportDisplay';
import { ResponsiveHeader } from '@/components/ui/responsive-header';

const ReportsPage = () => {
  const [selectedReport, setSelectedReport] = useState(null);
  const [showReportDisplay, setShowReportDisplay] = useState(false);

  const { data: reports = [] } = useQuery({
    queryKey: ['reports'],
    queryFn: async () => {
      // Using type assertion temporarily until Supabase types are regenerated
      const { data, error } = await (supabase as any)
        .from('reports')
        .select(`
          *,
          profiles(first_name, last_name, email)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  const viewReport = (report: any) => {
    // Convert the stored report data to the format expected by ReportDisplay
    const reportData = {
      ...report.data,
      generatedAt: report.created_at,
      generatedBy: `${report.profiles?.first_name || ''} ${report.profiles?.last_name || ''}`.trim() || report.profiles?.email
    };
    
    setSelectedReport(reportData);
    setShowReportDisplay(true);
  };

  return (
    <div className="p-6 space-y-6">
      <ResponsiveHeader
        title="Generated Reports"
        subtitle="View and manage operational reports"
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="h-5 w-5 mr-2" />
            Report History
          </CardTitle>
          <CardDescription>
            All generated operational reports
          </CardDescription>
        </CardHeader>
        <CardContent>
          {reports.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No reports generated yet
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Report Title</TableHead>
                  <TableHead>Generated By</TableHead>
                  <TableHead>Generated At</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.map((report: any) => (
                  <TableRow key={report.id}>
                    <TableCell className="font-medium">
                      {report.title}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <User className="h-4 w-4 mr-2 text-gray-400" />
                        {report.profiles?.first_name} {report.profiles?.last_name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                        {new Date(report.created_at).toLocaleString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => viewReport(report)}
                      >
                        View Report
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Report Display Dialog */}
      <ReportDisplay
        open={showReportDisplay}
        onOpenChange={setShowReportDisplay}
        reportData={selectedReport}
      />
    </div>
  );
};

export default ReportsPage;
