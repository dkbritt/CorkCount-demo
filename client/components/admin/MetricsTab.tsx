import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Wine,
  AlertTriangle,
  TrendingUp,
  Archive,
  Grape,
  PieChart,
  Calendar,
  Activity,
  Loader2,
  Package2,
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { formatError } from "@/lib/errors";
import { useIntersectionObserver } from "@/hooks/use-intersection-observer";

interface MetricCard {
  title: string;
  value: string | number;
  subtext: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

interface MetricsTabProps {
  settings?: {
    lowStockThreshold: number;
    outOfStockThreshold: number;
  };
}

export function MetricsTab({ settings }: MetricsTabProps = {}) {
  const { lowStockThreshold = 5, outOfStockThreshold = 0 } = settings || {};
  const { toast } = useToast();

  // State for Supabase data
  const [inventoryData, setInventoryData] = useState<any[]>([]);
  const [ordersData, setOrdersData] = useState<any[]>([]);
  const [batchesData, setBatchesData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Intersection observers for animations
  const { elementRef: headerRef, isIntersecting: headerInView } =
    useIntersectionObserver({
      threshold: 0.1,
      rootMargin: "0px 0px -50px 0px",
      triggerOnce: true,
    });

  const { elementRef: cardsRef, isIntersecting: cardsInView } =
    useIntersectionObserver({
      threshold: 0.1,
      rootMargin: "0px 0px -100px 0px",
      triggerOnce: true,
    });

  const { elementRef: activityRef, isIntersecting: activityInView } =
    useIntersectionObserver({
      threshold: 0.1,
      rootMargin: "0px 0px -100px 0px",
      triggerOnce: true,
    });

  // Recent activity data (can be expanded to pull from multiple tables)
  const [recentActivity, setRecentActivity] = useState([
    {
      id: 1,
      action: "Loading recent activity...",
      user: "System",
      time: "Now",
      status: "pending",
    },
  ]);

  // Fetch data from Supabase
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch aggregated metrics data via server API
        const response = await apiFetch("/metrics");

        if (!response.ok) {
          throw new Error(`API request failed with status ${response.status}`);
        }

        let result;
        try {
          result = await response.json();
        } catch (jsonError) {
          throw new Error("Failed to parse response as JSON");
        }

        if (!result.success) {
          throw new Error(result.error || "Failed to load metrics");
        }

        const inventory = result.inventory || [];
        const orders = result.orders || [];
        const batches = result.batches || [];

        setInventoryData(inventory);
        setOrdersData(orders);
        setBatchesData(batches);

        // Generate recent activity from multiple sources
        const allActivity = [];

        // Add recent orders
        if (orders && orders.length > 0) {
          const recentOrders = orders.slice(0, 10).map((order: any) => ({
            id: `order-${order.id}`,
            action: `New order ${order.order_number}`,
            user: order.customer_name || "Unknown Customer",
            time: getRelativeTime(order.created_at),
            status: order.status || "pending",
            type: "order",
            timestamp: new Date(order.created_at).getTime(),
          }));
          allActivity.push(...recentOrders);
        }

        // Add recent inventory additions/updates
        if (inventory && inventory.length > 0) {
          const recentInventory = inventory
            .filter((item) => item.created_at)
            .sort(
              (a, b) =>
                new Date(b.created_at).getTime() -
                new Date(a.created_at).getTime(),
            )
            .slice(0, 10)
            .map((item: any) => ({
              id: `inventory-${item.id}`,
              action: `Added ${item.name || "wine"} to inventory`,
              user: "Admin",
              time: getRelativeTime(item.created_at),
              status: "completed",
              type: "inventory",
              timestamp: new Date(item.created_at).getTime(),
            }));
          allActivity.push(...recentInventory);
        }

        // Add recent batch additions/updates
        if (batches && batches.length > 0) {
          const recentBatches = batches
            .filter((batch) => batch.created_at)
            .sort(
              (a, b) =>
                new Date(b.created_at).getTime() -
                new Date(a.created_at).getTime(),
            )
            .slice(0, 10)
            .map((batch: any) => ({
              id: `batch-${batch.id}`,
              action: `Created batch ${batch.name || "Unnamed Batch"}`,
              user: "Admin",
              time: getRelativeTime(batch.created_at),
              status: batch.status || "primary-fermentation",
              type: "batch",
              timestamp: new Date(batch.created_at).getTime(),
            }));
          allActivity.push(...recentBatches);
        }

        // Sort by timestamp (most recent first) and take top 10
        const sortedActivity = allActivity
          .sort((a, b) => b.timestamp - a.timestamp)
          .slice(0, 10)
          .map((item, index) => ({ ...item, id: index + 1 }));

        if (sortedActivity.length > 0) {
          setRecentActivity(sortedActivity);
        } else {
          setRecentActivity([
            {
              id: 1,
              action: "No recent activity",
              user: "System",
              time: "--",
              status: "info",
              type: "system",
            },
          ]);
        }
      } catch (err) {
        console.error("Error fetching metrics data:", formatError(err));
        setError("Failed to load metrics data");
        toast({
          title: "Error",
          description: "Failed to load metrics data from the database.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [toast]);

  // Helper function to get relative time
  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60),
    );

    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60)
      return `${diffInMinutes} minute${diffInMinutes === 1 ? "" : "s"} ago`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24)
      return `${diffInHours} hour${diffInHours === 1 ? "" : "s"} ago`;

    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} day${diffInDays === 1 ? "" : "s"} ago`;
  };

  // Calculate metrics from Supabase data
  const calculateMetrics = () => {
    if (loading) {
      return {
        totalInventory: 0,
        lowStockCount: 0,
        recentAdditions: 0,
        archivedBatches: 0,
        mostPopularType: "Loading...",
        wineTypeBreakdown: "Loading...",
      };
    }

    // Total inventory count
    const totalInventory = inventoryData
      .filter((item) => item.quantity > 0)
      .reduce((sum, item) => sum + (parseInt(item.quantity) || 0), 0);

    // Low stock alerts (quantity <= lowStockThreshold but > outOfStockThreshold)
    const lowStockCount = inventoryData.filter((item) => {
      const qty = parseInt(item.quantity) || 0;
      return qty <= lowStockThreshold && qty > outOfStockThreshold;
    }).length;

    // Recent additions (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentAdditions = inventoryData
      .filter((item) => {
        const itemDate = new Date(
          item.created_at || item.last_updated || "1970-01-01",
        );
        return itemDate >= sevenDaysAgo && (parseInt(item.quantity) || 0) > 0;
      })
      .reduce((sum, item) => sum + (parseInt(item.quantity) || 0), 0);

    // Completed/bottled batches count
    const completedBatches = batchesData.filter(
      (batch) => batch.status === "bottled" || batch.status === "completed",
    ).length;

    // Most popular wine type
    const typeQuantities = inventoryData
      .filter((item) => (parseInt(item.quantity) || 0) > 0)
      .reduce(
        (acc, item) => {
          const type = item.type || "Unknown";
          acc[type] = (acc[type] || 0) + (parseInt(item.quantity) || 0);
          return acc;
        },
        {} as Record<string, number>,
      );

    const mostPopularType =
      Object.entries(typeQuantities).sort(([, a], [, b]) => b - a)[0]?.[0] ||
      "No data";

    // Calculate wine type percentages
    const totalActiveQuantity = Object.values(typeQuantities).reduce(
      (sum, qty) => sum + qty,
      0,
    );
    const typePercentages = Object.entries(typeQuantities)
      .sort(([, a], [, b]) => b - a)
      .map(([type, quantity]) => ({
        type,
        percentage:
          totalActiveQuantity > 0
            ? Math.round((quantity / totalActiveQuantity) * 100)
            : 0,
      }));

    // Format top 3 types for display
    const wineTypeBreakdown =
      typePercentages.length > 0
        ? typePercentages
            .slice(0, 3)
            .map((item) => `${item.type} ${item.percentage}%`)
            .join(", ")
        : "No inventory data";

    return {
      totalInventory,
      lowStockCount,
      recentAdditions,
      archivedBatches: completedBatches,
      mostPopularType,
      wineTypeBreakdown,
    };
  };

  const metrics = calculateMetrics();

  const metricCards: MetricCard[] = [
    {
      title: "Total Inventory",
      value: metrics.totalInventory.toLocaleString(),
      subtext: "Updated daily",
      icon: Wine,
      color: "bg-wine",
    },
    {
      title: "Low Stock Alerts",
      value: metrics.lowStockCount,
      subtext: "Check Inventory tab",
      icon: AlertTriangle,
      color: "bg-orange-500",
    },
    {
      title: "Recent Additions",
      value: metrics.recentAdditions,
      subtext: "Batch Management activity",
      icon: TrendingUp,
      color: "bg-green-500",
    },
    {
      title: "Archived Batches",
      value: metrics.archivedBatches,
      subtext: "Stored for aging or review",
      icon: Archive,
      color: "bg-eggplant",
    },
    {
      title: "Most Popular Type",
      value: metrics.mostPopularType,
      subtext: "Based on current inventory",
      icon: Grape,
      color: "bg-wine",
    },
    {
      title: "Wine Type Overview",
      value: metrics.wineTypeBreakdown || "No data",
      subtext: "Based on current inventory",
      icon: PieChart,
      color: "bg-federal",
    },
  ];
  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "completed":
        return "bg-green-100 text-green-800";
      case "warning":
        return "bg-orange-100 text-orange-800";
      case "ready-for-pickup":
        return "bg-blue-100 text-blue-800";
      case "picked-up":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      case "primary-fermentation":
        return "bg-purple-100 text-purple-800";
      case "secondary-fermentation":
        return "bg-indigo-100 text-indigo-800";
      case "aging":
        return "bg-amber-100 text-amber-800";
      case "bottled":
        return "bg-green-100 text-green-800";
      case "info":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Remove getTrendIcon function as it's no longer needed

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div
        ref={headerRef}
        className={`admin-fade-in ${headerInView ? "animate" : ""}`}
        style={{ animationDelay: "0.1s" }}
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 md:w-12 md:h-12 bg-wine rounded-lg flex items-center justify-center">
            <Wine className="h-6 w-6 md:h-6 md:w-6 text-white" />
          </div>
          <h1 className="font-playfair text-2xl md:text-3xl font-bold text-wine">
            Dashboard Metrics
          </h1>
        </div>
        <p className="text-gray-600 ml-15">
          Monitor your wine inventory and business metrics with real-time
          insights
        </p>
      </div>

      {/* Metric Cards Grid */}
      <div
        ref={cardsRef}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {metricCards.slice(0, -1).map((metric, index) => {
          const Icon = metric.icon;

          return (
            <div
              key={index}
              className={`admin-metric-card admin-card-hover p-6 cursor-pointer admin-fade-in ${cardsInView ? "animate" : ""}`}
              style={{ animationDelay: `${0.1 + index * 0.1}s` }}
            >
              <div className="flex items-center justify-between mb-4">
                <div
                  className={`w-12 h-12 ${metric.color} flex items-center justify-center shadow-sm`}
                >
                  {loading ? (
                    <Loader2 className="h-6 w-6 text-white animate-spin" />
                  ) : (
                    <Icon className="h-6 w-6 text-white" />
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-wine">{metric.title}</p>
                <p className="text-3xl font-bold text-gray-900">
                  {loading ? (
                    <span className="animate-pulse bg-gray-200 rounded h-8 w-16 block"></span>
                  ) : (
                    metric.value
                  )}
                </p>
                <p className="text-sm text-gray-500">{metric.subtext}</p>
              </div>
            </div>
          );
        })}

        {/* Wine Type Breakdown Pie Chart */}
        {(() => {
          if (loading) {
            return (
              <div
                className={`admin-metric-card admin-card-hover p-6 admin-fade-in ${cardsInView ? "animate" : ""}`}
                style={{ animationDelay: `${0.1 + metricCards.length * 0.1}s` }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-federal rounded-lg flex items-center justify-center shadow-sm">
                    <Loader2 className="h-6 w-6 text-white animate-spin" />
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-wine">
                    Wine Type Breakdown
                  </p>
                  <p className="text-lg text-gray-500">Loading...</p>
                </div>
              </div>
            );
          }

          const typeQuantities = inventoryData
            .filter((item) => (parseInt(item.quantity) || 0) > 0)
            .reduce(
              (acc, item) => {
                const type = item.type || "Unknown";
                acc[type] = (acc[type] || 0) + (parseInt(item.quantity) || 0);
                return acc;
              },
              {} as Record<string, number>,
            );

          const totalQuantity = Object.values(typeQuantities).reduce(
            (sum, qty) => sum + qty,
            0,
          );
          const typeData = Object.entries(typeQuantities)
            .map(([type, quantity]) => ({
              type,
              quantity,
              percentage:
                totalQuantity > 0 ? (quantity / totalQuantity) * 100 : 0,
            }))
            .sort((a, b) => b.quantity - a.quantity);

          const colors = [
            "#9C1B2A", // Wine
            "#1F2937", // Federal
            "#7C3AED", // Purple
            "#059669", // Green
            "#DC2626", // Red
          ];

          if (typeData.length === 0) {
            return (
              <div
                className={`admin-metric-card admin-card-hover p-6 admin-fade-in ${cardsInView ? "animate" : ""}`}
                style={{ animationDelay: `${0.1 + metricCards.length * 0.1}s` }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-federal rounded-lg flex items-center justify-center shadow-sm">
                    <PieChart className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-wine">
                    Wine Type Breakdown
                  </p>
                  <p className="text-lg text-gray-500">No inventory data</p>
                </div>
              </div>
            );
          }

          let cumulativePercentage = 0;
          const radius = 80;
          const centerX = 100;
          const centerY = 100;

          return (
            <div
              className={`admin-metric-card admin-card-hover p-6 admin-fade-in ${cardsInView ? "animate" : ""}`}
              style={{ animationDelay: `${0.1 + metricCards.length * 0.1}s` }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-federal rounded-lg flex items-center justify-center shadow-sm">
                  <PieChart className="h-6 w-6 text-white" />
                </div>
              </div>

              <div className="space-y-4">
                <p className="text-sm font-medium text-wine">
                  Wine Type Breakdown
                </p>

                {/* SVG Pie Chart */}
                <div className="flex flex-col lg:flex-row items-center gap-4">
                  <div className="flex-shrink-0">
                    <svg
                      width="200"
                      height="200"
                      viewBox="0 0 200 200"
                      className="w-32 h-32 lg:w-40 lg:h-40"
                    >
                      {typeData.map((data, index) => {
                        const startAngle = (cumulativePercentage / 100) * 360;
                        const endAngle =
                          startAngle + (data.percentage / 100) * 360;

                        const startAngleRad =
                          (startAngle - 90) * (Math.PI / 180);
                        const endAngleRad = (endAngle - 90) * (Math.PI / 180);

                        const x1 = centerX + radius * Math.cos(startAngleRad);
                        const y1 = centerY + radius * Math.sin(startAngleRad);
                        const x2 = centerX + radius * Math.cos(endAngleRad);
                        const y2 = centerY + radius * Math.sin(endAngleRad);

                        const largeArcFlag = data.percentage > 50 ? 1 : 0;

                        const pathData = [
                          `M ${centerX} ${centerY}`,
                          `L ${x1} ${y1}`,
                          `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
                          "Z",
                        ].join(" ");

                        cumulativePercentage += data.percentage;

                        return (
                          <path
                            key={data.type}
                            d={pathData}
                            fill={colors[index % colors.length]}
                            stroke="white"
                            strokeWidth="2"
                            className="hover:opacity-80 transition-opacity"
                          />
                        );
                      })}
                    </svg>
                  </div>

                  {/* Legend */}
                  <div className="flex-1 space-y-2">
                    {typeData.map((data, index) => (
                      <div
                        key={data.type}
                        className="flex items-center gap-2 text-sm"
                      >
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{
                            backgroundColor: colors[index % colors.length],
                          }}
                        />
                        <span className="font-medium text-gray-700">
                          {data.type}
                        </span>
                        <span className="text-gray-500">
                          {data.percentage.toFixed(1)}% ({data.quantity}{" "}
                          bottles)
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <p className="text-sm text-gray-500">
                  Based on current inventory
                </p>
              </div>
            </div>
          );
        })()}
      </div>

      {/* Recent Activity */}
      <div
        ref={activityRef}
        className={`bg-white rounded-lg border border-gray-200 admin-fade-in ${activityInView ? "animate" : ""}`}
        style={{ animationDelay: "0.3s" }}
      >
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-wine rounded-lg flex items-center justify-center">
              <Activity className="h-5 w-5 text-white" />
            </div>
            <h2 className="font-playfair text-xl font-semibold text-wine">
              Recent Activity
            </h2>
          </div>
        </div>

        <div className="divide-y divide-gray-200">
          {recentActivity.map((activity, index) => (
            <div
              key={activity.id}
              className={`p-6 hover:bg-white/50 transition-all duration-200 admin-fade-in ${activityInView ? "animate" : ""}`}
              style={{ animationDelay: `${0.4 + index * 0.05}s` }}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-wine mb-1">
                    {activity.action}
                  </p>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <span>{activity.user}</span>
                    <span>•</span>
                    <span>{activity.time}</span>
                  </div>
                </div>
                <Badge
                  className={`text-xs px-2 py-1 ${getStatusColor(activity.status)}`}
                >
                  {activity.status}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
