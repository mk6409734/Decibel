import React, { useState } from "react";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Bell, BellOff, ChevronDown, ChevronUp } from "lucide-react";
import { SirenType } from "@/types";
import SirenStatusBadge from "./SirenStatusBadge";
import SirenControlDialog from "@/components/SirenControlDialog";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface SirenListProps {
  sirens: any[];
  sendSignal?: (
    sirenId: string,
    type: string,
    value: any,
    alarmType: string,
    gapAudio: number,
    language: string
  ) => void;
}

const SirenList: React.FC<SirenListProps> = ({ sirens, sendSignal }) => {
  console.log("sirensdata", sirens);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<SirenType[]>([
    "GPRS",
    "Ethernet",
  ]);
  const [expandedDistrictId, setExpandedDistrictId] = useState<string | null>(
    null
  );
  const [expandedBlockId, setExpandedBlockId] = useState<string | null>(null);

  // Dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedSiren, setSelectedSiren] = useState<any>(null);

  // Flatten all sirens for filtering
  const allSirens = sirens.flatMap((district) =>
    district.blocks.flatMap((block) => block.sirens)
  );

  const filteredSirens = allSirens.filter((siren) => {
    const matchesSearch =
      siren.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      siren.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = siren.type.some((t) => typeFilter.includes(t));
    return matchesSearch && matchesType;
  });

  const handleTypeFilterChange = (type: SirenType) => {
    setTypeFilter((prev) => {
      if (prev.includes(type)) {
        return prev.filter((t) => t !== type);
      } else {
        return [...prev, type];
      }
    });
  };

  const handleTestSiren = (siren: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedSiren(siren);
    setIsDialogOpen(true);
  };

  const toggleDistrict = (districtId: string) => {
    setExpandedDistrictId((prev) => (prev === districtId ? null : districtId));
    setExpandedBlockId(null);
  };

  const toggleBlock = (blockId: string) => {
    setExpandedBlockId((prev) => (prev === blockId ? null : blockId));
  };

  const handleDownloadLogs = async () => {
    try {
      // Fetch logs for all sirens
      const response = await fetch('http://localhost:5001/api/controller/logs'); // Adjust URL based on your API base path
      if (!response.ok) {
        throw new Error('Failed to fetch logs');
      }
      const sirens = await response.json();

      // Create PDF
      const doc = new jsPDF();
      doc.setFontSize(16);
      doc.text('Siren Execution Logs', 14, 20);

      // Prepare table data
      const tableData = sirens.flatMap((siren: any) =>
        siren.logs.map((log: any) => [
          siren.id,
          siren.name,
          log.action.toUpperCase(),
          new Date(log.timestamp).toLocaleString(),
          log.alertType || '-',
          log.message || '-',
        ])
      );

      // Generate table
      autoTable(doc, {
        head: [['Siren ID', 'Siren Name', 'Action', 'Timestamp', 'Alert Type', 'Message']],
        body: tableData,
        startY: 30,
        styles: { fontSize: 10 },
        headStyles: { fillColor: [66, 66, 66], textColor: [255, 255, 255] },
        alternateRowStyles: { fillColor: [240, 240, 240] },
      });

      // Download PDF
      doc.save('siren_execution_logs.pdf');
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to download logs. Please try again.');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4"></div>

      <div className="rounded border border-industrial-steel/30 overflow-hidden">
        <div className="bg-industrial-blue text-white py-2 px-4 font-semibold flex items-center justify-between">
          <div>Siren List</div>
          <div className="text-sm space-x-4">
            <Button
              className="border border-gray-500 py-2 px-2 rounded-lg hover:bg-industrial-steel transition-all"
              onClick={handleDownloadLogs}
            >
              Download Siren Executions
            </Button>
            <span>Total: {filteredSirens.length} sirens</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-industrial-gray">
              <TableRow>
                <TableHead className="text-white">Name</TableHead>
                <TableHead className="text-white">Type</TableHead>
                <TableHead className="text-white">Location</TableHead>
                <TableHead className="text-white">Status</TableHead>
                <TableHead className="text-white">Last Checked</TableHead>
                <TableHead className="text-white text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
          </Table>
          <div style={{ maxHeight: "40vh", overflowY: "auto" }}>
            <Table>
              <TableBody>
                {sirens.map((district) => (
                  <React.Fragment key={district.id}>
                    <TableRow
                      className="border-industrial-steel/30 hover:bg-industrial-steel/10 cursor-pointer"
                      onClick={() => toggleDistrict(district.id)}
                    >
                      <TableCell colSpan={6} className="font-medium">
                        <div className="flex items-center gap-2">
                          {district.name}
                          {expandedDistrictId === district.id ? (
                            <ChevronUp className="h-4 w-4 text-gray-400" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-gray-400" />
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                    {expandedDistrictId === district.id &&
                      district.blocks.map((block) => (
                        <React.Fragment key={block.id}>
                          <TableRow
                            className="border-industrial-steel/30 hover:bg-industrial-steel/10 cursor-pointer"
                            onClick={() => toggleBlock(block.id)}
                          >
                            <TableCell colSpan={6} className="pl-8 font-medium">
                              <div className="flex items-center gap-2">
                                {block.name}
                                {expandedBlockId === block.id ? (
                                  <ChevronUp className="h-4 w-4 text-gray-400" />
                                ) : (
                                  <ChevronDown className="h-4 w-4 text-gray-400" />
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                          {expandedBlockId === block.id &&
                            block.sirens.map((siren) => (
                              <TableRow
                                key={siren.id}
                                className="border-industrial-steel/30 hover:bg-industrial-steel/10"
                              >
                                <TableCell className="pl-16">
                                  {siren.name}
                                </TableCell>
                                <TableCell>{siren.type}</TableCell>
                                <TableCell>{siren.location}</TableCell>
                                <TableCell>
                                  <SirenStatusBadge status={siren.status} />
                                </TableCell>
                                <TableCell className="text-sm text-gray-400">
                                  {new Date(siren.lastChecked).toLocaleString()}
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="flex justify-end gap-2">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 text-industrial-yellow"
                                      onClick={(e) => handleTestSiren(siren, e)}
                                    >
                                      <Bell className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                        </React.Fragment>
                      ))}
                  </React.Fragment>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      {/* Siren Control Dialog */}
      {selectedSiren && (
        <SirenControlDialog
          siren={selectedSiren}
          isOpen={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          sendSignal={sendSignal}
        />
      )}
    </div>
  );
};

export default SirenList;