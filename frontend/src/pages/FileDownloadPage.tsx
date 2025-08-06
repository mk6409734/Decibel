import { create } from "xmlbuilder2";
import { CAPAlert } from "@/types/cap";
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wrench } from "lucide-react";
import { useData } from "@/context/DataContext";
import { Info, MapPin, Clock } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { saveAs } from "file-saver";
import { Document, Packer, Paragraph, TextRun } from "docx";
import { socket } from "@/lib/socket";

interface fileDownloadPageProps {
  title: string;
  icon: React.ReactNode;
}

const FileDownloadPage: React.FC<fileDownloadPageProps> = ({ title, icon }) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  const { capAlerts, fetchActiveAlerts, sirens } = useData();

  // useEffect(() => {
  //   fetchActiveAlerts();
  // }, []);

  useEffect(() => {
    fetchActiveAlerts();
  }, [capAlerts]);

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("CAP Alerts Log", 14, 20);

    const tableData = capAlerts.map((alert) => [
      alert.info[0]?.event,
      alert.info[0]?.severity,
      alert.info[0]?.headline,
      alert.info[0]?.area?.[0]?.areaDesc,
      new Date(alert.sent).toLocaleString(),
    ]);

    autoTable(doc, {
      startY: 30,
      head: [["Event", "Severity", "Headline", "Area", "Sent"]],
      body: tableData,
    });

    doc.save("CAP_Alerts_Log.pdf");
  };

  // const handleDownloadDOCX = async () => {
  //   const doc = new Document({
  //     creator: "Mohith Gautam",
  //     title: "CAP Alerts Log",
  //     description: "Downloaded CAP alert logs as DOCX",
  //     sections: [
  //       {
  //         properties: {},
  //         children: alertParagraphs,
  //       },
  //     ],
  //   });

  //   const alertParagraphs = capAlerts.map((alert) => {
  //     const info = alert.info[0];
  //     return new Paragraph({
  //       children: [
  //         new TextRun({ text: `Event: ${info.event}`, bold: true }),
  //         new TextRun(`\nSeverity: ${info.severity}`),
  //         new TextRun(`\nHeadline: ${info.headline}`),
  //         new TextRun(`\nArea: ${info.area?.[0]?.areaDesc}`),
  //         new TextRun(`\nSent: ${new Date(alert.sent).toLocaleString()}`),
  //         new TextRun("\n\n"),
  //       ],
  //     });
  //   });

  //   doc.addSection({
  //     children: [
  //       new Paragraph({
  //         text: "CAP Alerts Log",
  //         heading: HeadingLevel.HEADING_1,
  //       }),
  //       ...alertParagraphs,
  //     ],
  //   });

  //   const blob = await Packer.toBlob(doc);
  //   saveAs(blob, "CAP_Alerts_Log.docx");
  // };

  const handleDownloadDOCX = async () => {
    try {
      const alertParagraphs = capAlerts
        .map((alert) => {
          const info = alert.info?.[0];
          if (!info) return null;

          return new Paragraph({
            children: [
              new TextRun({ text: `Event: ${info.event}`, bold: true }),
              new TextRun(`\nSeverity: ${info.severity}`),
              new TextRun(`\nHeadline: ${info.headline}`),
              new TextRun(`\nArea: ${info.area?.[0]?.areaDesc}`),
              new TextRun(`\nSent: ${new Date(alert.sent).toLocaleString()}`),
              new TextRun("\n\n"),
            ],
          });
        })
        .filter(Boolean); // remove nulls

      const doc = new Document({
        creator: "Mohith Gautam",
        title: "CAP Alerts Log",
        description: "Downloaded CAP alert logs as DOCX",
        sections: [
          {
            properties: {},
            children: alertParagraphs,
          },
        ],
      });

      const blob = await Packer.toBlob(doc);
      saveAs(blob, "CAP_Alerts_Log.docx");
    } catch (error) {
      console.error("DOCX download failed:", error);
    }
  };

  // utils/xmlUtils.ts
  function convertAlertsToXML(alerts: CAPAlert[]): string {
    const root = create({ version: "1.0" }).ele("CAPAlerts");
    alerts.forEach((alert) => {
      const info = alert.info?.[0];
      const alertElem = root.ele("Alert");
      alertElem.ele("ID").txt(alert._id).up();
      if (info) {
        alertElem.ele("Event").txt(info.event).up();
        alertElem.ele("Headline").txt(info.headline).up();
        alertElem.ele("Severity").txt(info.severity).up();
        alertElem
          .ele("Area")
          .txt(info.area?.[0]?.areaDesc || "")
          .up();
        alertElem.ele("Sent").txt(new Date(alert.sent).toISOString()).up();
        alertElem.ele("Expires").txt(new Date(info.expires).toISOString()).up();
      }
      alertElem.up();
    });
    return root.end({ prettyPrint: true });
  }

  const handleDownloadXML = () => {
    const xmlString = convertAlertsToXML(capAlerts);
    const blob = new Blob([xmlString], { type: "application/xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "cap_alerts_log.xml";
    a.click();
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    // Set up an interval to update the time every second
    const intervalId = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    // Clean up the interval when the component unmounts
    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{title}</h1>
        <div className="text-sm text-gray-400">
          Last updated: {currentTime.toLocaleString()}
        </div>
      </div>

      <Card className="bg-industrial-dark border-industrial-steel/30">
        <CardHeader className="text-center pb-4">
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 bg-industrial-steel/20 rounded-full flex items-center justify-center">
              {icon}
            </div>
          </div>
          <CardTitle className="text-xl">{title}</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <div className="mt-4 py-4 px-8 bg-industrial-steel/10 rounded-md inline-block space-x-5">
            <button
              onClick={handleDownloadPDF}
              className="px-2 py-2 rounded-md bg-green-600  text-white hover:bg-green-700"
            >
              Download PDF
            </button>
            <button
              onClick={handleDownloadDOCX}
              className="px-2 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700"
            >
              Download DOCX
            </button>
            <button
              onClick={handleDownloadXML}
              className="px-2 py-2 rounded-md bg-fuchsia-600 text-white hover:bg-fuchsia-700"
            >
              Download XML
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FileDownloadPage;
