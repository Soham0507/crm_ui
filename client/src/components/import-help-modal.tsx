import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, FileText, CheckCircle } from "lucide-react";

interface ImportHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ImportHelpModal({ isOpen, onClose }: ImportHelpModalProps) {
  const downloadSampleCSV = () => {
    const sampleData = [
      ['name', 'email', 'phone', 'company', 'status', 'dealValue', 'tags'],
      ['John Smith', 'john@acme.com', '+1-555-123-4567', 'Acme Corp', 'lead', '5000', 'sales,enterprise'],
      ['Jane Doe', 'jane@example.com', '+1-555-987-6543', 'Example Inc', 'qualified', '12000', 'marketing,priority'],
      ['Bob Johnson', 'bob@startup.io', '', 'Startup Labs', 'proposal', '8500', 'tech'],
    ];
    
    const csvContent = sampleData.map(row => 
      row.map(field => `"${field}"`).join(',')
    ).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'sample-contacts.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <FileText className="h-5 w-5 mr-2" />
            CSV Import Guide
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Required Format */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Required CSV Format</h4>
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Badge variant="outline" className="mb-2">Required Fields</Badge>
                  <ul className="space-y-1 text-gray-700">
                    <li className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                      <code className="bg-gray-200 px-1 rounded">name</code>
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                      <code className="bg-gray-200 px-1 rounded">email</code>
                    </li>
                  </ul>
                </div>
                <div>
                  <Badge variant="outline" className="mb-2">Optional Fields</Badge>
                  <ul className="space-y-1 text-gray-700">
                    <li><code className="bg-gray-200 px-1 rounded">phone</code></li>
                    <li><code className="bg-gray-200 px-1 rounded">company</code></li>
                    <li><code className="bg-gray-200 px-1 rounded">status</code></li>
                    <li><code className="bg-gray-200 px-1 rounded">dealValue</code></li>
                    <li><code className="bg-gray-200 px-1 rounded">tags</code></li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Status Values */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Valid Status Values</h4>
            <div className="flex flex-wrap gap-2">
              <Badge className="bg-slate-100 text-slate-700">lead</Badge>
              <Badge className="bg-green-100 text-green-800">qualified</Badge>
              <Badge className="bg-yellow-100 text-yellow-800">proposal</Badge>
              <Badge className="bg-green-100 text-green-800">closed-won</Badge>
              <Badge className="bg-red-100 text-red-800">closed-lost</Badge>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Default status is "lead" if not specified
            </p>
          </div>

          {/* Tags Format */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Tags Format</h4>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-sm text-gray-700">
                Separate multiple tags with commas: <code className="bg-gray-200 px-1 rounded">sales,enterprise,priority</code>
              </p>
            </div>
          </div>

          {/* Sample CSV */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-gray-900">Sample CSV File</h4>
              <Button variant="outline" size="sm" onClick={downloadSampleCSV}>
                <Download className="h-4 w-4 mr-2" />
                Download Sample
              </Button>
            </div>
            <div className="bg-gray-900 text-gray-100 rounded-lg p-4 text-xs font-mono overflow-x-auto">
              <div className="whitespace-nowrap">
                name,email,phone,company,status,dealValue,tags<br/>
                "John Smith","john@acme.com","+1-555-123-4567","Acme Corp","lead","5000","sales,enterprise"<br/>
                "Jane Doe","jane@example.com","+1-555-987-6543","Example Inc","qualified","12000","marketing,priority"
              </div>
            </div>
          </div>

          {/* Tips */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Import Tips</h4>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start">
                <CheckCircle className="h-4 w-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                Headers are case-insensitive (Name, EMAIL, company all work)
              </li>
              <li className="flex items-start">
                <CheckCircle className="h-4 w-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                Empty fields are allowed for optional columns
              </li>
              <li className="flex items-start">
                <CheckCircle className="h-4 w-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                Duplicate emails will be skipped with a warning
              </li>
              <li className="flex items-start">
                <CheckCircle className="h-4 w-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                Invalid rows will be reported in the import summary
              </li>
            </ul>
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-6 border-t">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}