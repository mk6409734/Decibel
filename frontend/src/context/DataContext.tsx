import React, { createContext, useContext, useState, useEffect } from "react";
import { District, Siren } from "../types";
import * as api from "../services/api";
import { CAPAlert } from "@/types/cap";
import { capAlertService } from "@/services/capApi";
import { socket } from "@/lib/socket";
import { useToast } from "@/hooks/use-toast";

interface DataContextType {
  districts: District[];
  sirens: Siren[];
  loading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
  updateSiren: (sirenId: string, updates: any) => void;
  updateDistrict: (districtId: string, updates: Partial<District>) => void;
  setDistricts: (districts: District[]) => void;
  setSirens: (sirens: Siren[]) => void;
  paginatedAlerts: CAPAlert[];
  selectedAlert: CAPAlert | null;
  setSelectedAlert: (alert: CAPAlert | null) => void;
  formatRelativeTime: (date: Date) => string;
  getSeverityBadgeClass: (severity: string) => string;
  capAlerts: CAPAlert[];
  fetchActiveAlerts: () => Promise<void>;
  refreshAlerts: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [districts, setDistricts] = useState<District[]>([]);
  const [sirens, setSirens] = useState<Siren[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [capAlerts, setCapAlerts] = useState<CAPAlert[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [severityFilter, setSeverityFilter] = useState<string[]>([
    "Extreme",
    "Severe",
    "Moderate",
    "Minor",
  ]);
  const [selectedAlert, setSelectedAlert] = useState<CAPAlert | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const { toast } = useToast();

  const refreshData = async () => {
    try {
      setLoading(true);
      console.log("Fetching sirens...");
      const [districtsData, sirensData] = await Promise.all([
        api.getDistricts(),
        api.getSirens(),
      ]);
      console.log("Fetched sirens:", sirensData);
      setDistricts(districtsData);
      setSirens(sirensData);
      setError(null);
    } catch (err) {
      setError("Failed to fetch data");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const updateSiren = (sirenId: string, updates: Partial<Siren>) => {
    setDistricts((prev) =>
      prev.map((d) => ({
        ...d,
        blocks: d.blocks.map((b) => ({
          ...b,
          sirens: b.sirens.map((s) =>
            s.id === sirenId ? { ...s, ...updates } : s
          ),
        })),
      }))
    );

    setSirens((prev) =>
      prev.map((siren) =>
        siren.id === sirenId ? { ...siren, ...updates } : siren
      )
    );
  };


  const updateDistrict = (districtId: string, updates: Partial<District>) => {
    setDistricts((prev) =>
      prev.map((d) => (d.id === districtId ? { ...d, ...updates } : d))
    );
  };

  // 🔁 Fetch sirens and districts on load
  useEffect(() => {
    refreshData();
  }, []);

  // 🔁 Fetch alerts on load
  useEffect(() => {
    fetchActiveAlerts();
  }, []);

  // 🔔 Listen for new/updated alerts via socket
  useEffect(() => {
    const handleNewAlert = (alert: CAPAlert) => {
      setCapAlerts((prev) => [alert, ...prev]);
      toast({
        title: "New Alert",
        description: alert.info?.[0]?.headline || "New CAP Alert",
        variant:
          alert.info?.[0]?.severity === "Extreme" ? "destructive" : "default",
      });
    };

    const handleUpdateAlert = (alert: CAPAlert) => {
      setCapAlerts((prev) =>
        prev.map((a) => (a._id === alert._id ? alert : a))
      );
    };

    socket.on("cap-alert-new", handleNewAlert);
    socket.on("cap-alert-update", handleUpdateAlert);

    return () => {
      socket.off("cap-alert-new", handleNewAlert);
      socket.off("cap-alert-update", handleUpdateAlert);
    };
  }, [toast]);

  const fetchActiveAlerts = async () => {
    try {
      const alerts = await capAlertService.getActiveAlerts();
      setCapAlerts(alerts);
    } catch (err) {
      console.error("Error fetching CAP alerts:", err);
    }
  };

  const refreshAlerts = async () => {
    try {
      const result = await capAlertService.refreshAlerts();
      if (result.success) {
        toast({
          title: "Alerts Refreshed",
          description: `Fetched ${result.alerts?.length || 0} alerts`,
        });
        fetchActiveAlerts();
      }
    } catch (err) {
      toast({
        title: "Refresh Failed",
        description: "Unable to refresh CAP alerts",
        variant: "destructive",
      });
      console.error("Refresh error:", err);
    }
  };

  const filteredAlerts = capAlerts.filter((alert) => {
    const matchesSearch =
      alert.info?.[0]?.headline
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      alert.info?.[0]?.event
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      alert.info?.[0]?.area?.[0]?.areaDesc
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase());

    const matchesSeverity = alert.info?.some((info) =>
      severityFilter.includes(info.severity)
    );
    return matchesSearch && matchesSeverity;
  });

  const totalPages = Math.ceil(filteredAlerts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedAlerts = filteredAlerts.slice(startIndex, endIndex);

  const formatRelativeTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return hours > 0
      ? `${hours}h ago`
      : minutes > 0
      ? `${minutes}m ago`
      : "Just now";
  };

  const getSeverityBadgeClass = (severity: string) => {
    switch (severity) {
      case "Extreme":
        return "bg-red-900/30 text-red-300 border-red-700/50";
      case "Severe":
        return "bg-orange-900/30 text-orange-300 border-orange-700/50";
      case "Moderate":
        return "bg-yellow-900/30 text-yellow-300 border-yellow-700/50";
      case "Minor":
        return "bg-blue-900/30 text-blue-300 border-blue-700/50";
      default:
        return "bg-gray-800/30 text-gray-300 border-gray-700/50";
    }
  };

  return (
    <DataContext.Provider
      value={{
        districts,
        sirens,
        loading,
        error,
        refreshData,
        updateSiren,
        updateDistrict,
        setDistricts,
        setSirens,
        paginatedAlerts,
        selectedAlert,
        setSelectedAlert,
        formatRelativeTime,
        getSeverityBadgeClass,
        capAlerts,
        fetchActiveAlerts,
        refreshAlerts,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) throw new Error("useData must be used within a DataProvider");
  return context;
};