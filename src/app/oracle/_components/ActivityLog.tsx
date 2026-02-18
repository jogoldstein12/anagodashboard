import { GlassPanel } from "@/components/GlassPanel";
import { Activity, Code, FileText, Terminal, Search, MessageSquare, Clock, AlertCircle } from "lucide-react";
import { format } from "date-fns";

interface ActivityLogProps {
  activities: any[];
}

export function ActivityLog({ activities }: ActivityLogProps) {
  const formatDate = (timestamp: number) => {
    return format(new Date(timestamp), "HH:mm:ss");
  };

  const getActivityIcon = (toolCalls: any[]) => {
    if (!toolCalls || toolCalls.length === 0) {
      return <Activity className="w-4 h-4 text-white/50" />;
    }
    
    const firstCall = toolCalls[0];
    const toolName = firstCall.name?.toLowerCase() || '';
    
    switch (true) {
      case toolName.includes('exec'):
        return <Terminal className="w-4 h-4 text-amber-400" />;
      case toolName.includes('write'):
      case toolName.includes('edit'):
        return <FileText className="w-4 h-4 text-blue-400" />;
      case toolName.includes('search'):
        return <Search className="w-4 h-4 text-green-400" />;
      case toolName.includes('message'):
        return <MessageSquare className="w-4 h-4 text-purple-400" />;
      case toolName.includes('read'):
        return <Code className="w-4 h-4 text-emerald-400" />;
      default:
        return <Activity className="w-4 h-4 text-white/50" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "running": return "bg-green-500/20 text-green-400";
      case "completed": return "bg-blue-500/20 text-blue-400";
      case "error": return "bg-red-500/20 text-red-400";
      default: return "bg-gray-500/20 text-gray-400";
    }
  };

  const getToolCallSummary = (toolCalls: any[]) => {
    if (!toolCalls || toolCalls.length === 0) return "No tools called";
    
    const call = toolCalls[0];
    const toolName = call.name || 'unknown';
    const args = call.arguments || {};
    
    // Extract meaningful info from arguments
    if (toolName.includes('exec')) {
      const cmd = args.command || '';
      return `Exec: ${cmd.substring(0, 40)}${cmd.length > 40 ? '...' : ''}`;
    } else if (toolName.includes('write')) {
      const path = args.path || '';
      return `Write: ${path.split('/').pop()}`;
    } else if (toolName.includes('read')) {
      const path = args.path || '';
      return `Read: ${path.split('/').pop()}`;
    } else if (toolName.includes('message')) {
      return `Message sent`;
    } else {
      return `${toolName.replace('_', ' ')}`;
    }
  };

  const getTokenCount = (tokenUsage: any) => {
    if (!tokenUsage) return "0";
    const total = tokenUsage.totalTokens || tokenUsage.completionTokens + tokenUsage.promptTokens || 0;
    if (total >= 1000) return `${(total / 1000).toFixed(1)}k`;
    return total.toString();
  };

  const truncatePrompt = (prompt: string) => {
    if (!prompt) return "Thinking...";
    if (prompt.length <= 60) return prompt;
    return prompt.substring(0, 60) + "...";
  };

  return (
    <GlassPanel className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-white">Activity Log</h2>
        <div className="text-sm text-white/50">
          Last {activities?.length || 0} turns
        </div>
      </div>

      {!activities || activities.length === 0 ? (
        <div className="text-center py-8 text-white/50">
          <Activity className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No activity recorded</p>
        </div>
      ) : (
        <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
          {activities.map((activity) => (
            <div key={activity.turnId} className="p-4 bg-white/[0.03] rounded-xl border border-white/10 hover:bg-white/[0.05] transition-colors">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-3">
                  {getActivityIcon(activity.toolCalls)}
                  <div>
                    <div className="text-white font-medium text-sm">
                      {getToolCallSummary(activity.toolCalls)}
                    </div>
                    <div className="text-xs text-white/50 mt-1">
                      {truncatePrompt(activity.prompt)}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`px-2 py-1 rounded text-xs ${getStatusColor(activity.status)}`}>
                    {activity.status}
                  </div>
                  <div className="text-xs text-white/50 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatDate(activity.timestamp)}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/10">
                <div className="flex items-center gap-4 text-xs text-white/50">
                  <div className="flex items-center gap-1">
                    <span>Tokens:</span>
                    <span className="text-white">{getTokenCount(activity.tokenUsage)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span>Duration:</span>
                    <span className="text-white">{activity.durationMs}ms</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span>Tools:</span>
                    <span className="text-white">{activity.toolCalls?.length || 0}</span>
                  </div>
                </div>
                
                <div className="text-xs text-white/30">
                  {activity.turnId?.substring(0, 8)}...
                </div>
              </div>

              {/* Show errors if any */}
              {activity.status?.toLowerCase() === "error" && (
                <div className="mt-3 p-2 bg-red-500/10 border border-red-500/20 rounded text-xs text-red-300">
                  <div className="flex items-center gap-1 mb-1">
                    <AlertCircle className="w-3 h-3" />
                    <span className="font-medium">Error occurred</span>
                  </div>
                  {/* Could show error details here if available */}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Summary */}
      {activities && activities.length > 0 && (
        <div className="mt-6 pt-6 border-t border-white/10">
          <div className="grid grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-lg font-bold text-white">
                {activities.filter(a => a.status?.toLowerCase() === "running").length}
              </div>
              <div className="text-xs text-white/50">Active</div>
            </div>
            <div>
              <div className="text-lg font-bold text-white">
                {activities.reduce((sum, a) => {
                  const tokens = a.tokenUsage?.totalTokens || 
                                (a.tokenUsage?.completionTokens + a.tokenUsage?.promptTokens) || 0;
                  return sum + tokens;
                }, 0).toLocaleString()}
              </div>
              <div className="text-xs text-white/50">Total Tokens</div>
            </div>
            <div>
              <div className="text-lg font-bold text-white">
                {activities.reduce((sum, a) => sum + (a.toolCalls?.length || 0), 0)}
              </div>
              <div className="text-xs text-white/50">Tool Calls</div>
            </div>
            <div>
              <div className="text-lg font-bold text-white">
                {activities.filter(a => a.status?.toLowerCase() === "error").length}
              </div>
              <div className="text-xs text-white/50">Errors</div>
            </div>
          </div>
        </div>
      )}
    </GlassPanel>
  );
}