import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  getPipeline,
  getJobs,
  getJobLogs,
  getDeployment,
  getDeploymentLogs
} from '../lib/api';
import type { Job } from '../lib/api';
import {
  CheckCircle2,
  XCircle,
  Loader2,
  Clock,
  GitCommit,
  GitBranch,
  Terminal,
  ChevronRight,
  X,
  Server,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const StatusIcon = ({ status, size = 16 }: { status: string; size?: number }) => {
  switch (status) {
    case 'success':
      return <CheckCircle2 size={size} className="text-green-500" />;
    case 'failed':
      return <XCircle size={size} className="text-destructive" />;
    case 'running':
    case 'deploying':
      return <Loader2 size={size} className="text-blue-500 animate-spin" />;
    default:
      return <Clock size={size} className="text-muted-foreground" />;
  }
};

const JobCard = ({ job, onClick, isActive }: { job: Job; onClick: () => void; isActive: boolean }) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left p-3 rounded-lg border transition-all relative group bg-card",
        isActive
          ? "border-primary ring-1 ring-primary bg-primary/5"
          : "border-border hover:border-primary/50 hover:shadow-sm"
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="font-medium text-sm text-foreground truncate pr-2" title={job.name}>
          {job.name}
        </span>
        <StatusIcon status={job.status} />
      </div>

      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Clock size={12} />
        {job.started_at
          ? formatDistanceToNow(new Date(job.started_at), { addSuffix: true })
          : 'Pending'
        }
      </div>

      {/* Connector line for graph visualization */}
      <div className="absolute top-1/2 -right-6 w-6 h-0.5 bg-border hidden group-last:hidden md:block" />
    </button>
  );
};

export function PipelineDetail() {
  const { projectId, pipelineId } = useParams<{ projectId: string; pipelineId: string }>();
  const pId = parseInt(projectId || '0');
  const pipeId = parseInt(pipelineId || '0');

  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [showDeploymentLogs, setShowDeploymentLogs] = useState(false);
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Queries
  const { data: pipeline, isLoading: isPipelineLoading } = useQuery({
    queryKey: ['pipeline', pId, pipeId],
    queryFn: () => getPipeline(pId, pipeId),
    refetchInterval: 2000,
  });

  const { data: jobs, isLoading: isJobsLoading } = useQuery({
    queryKey: ['jobs', pId, pipeId],
    queryFn: () => getJobs(pId, pipeId),
    refetchInterval: 2000,
  });

  const { data: deployment } = useQuery({
    queryKey: ['deployment', pId, pipeId],
    queryFn: () => getDeployment(pId, pipeId),
    refetchInterval: 2000,
  });

  // Logs Query (Job)
  const { data: jobLogs } = useQuery({
    queryKey: ['jobLogs', pId, pipeId, selectedJob?.id],
    queryFn: () => getJobLogs(pId, pipeId, selectedJob!.id),
    enabled: !!selectedJob,
    refetchInterval: (query) => {
      if (selectedJob?.status === 'success' || selectedJob?.status === 'failed') return false;
      return 1000;
    }
  });

  // Logs Query (Deployment)
  const { data: deployLogs } = useQuery({
    queryKey: ['deployLogs', pId, pipeId],
    queryFn: () => getDeploymentLogs(pId, pipeId),
    enabled: showDeploymentLogs,
    refetchInterval: (query) => {
      if (deployment?.status === 'success' || deployment?.status === 'failed') return false;
      return 1000;
    }
  });

  // Auto-scroll logs
  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [jobLogs, deployLogs]);

  // Group jobs by stage
  const stages = React.useMemo(() => {
    if (!jobs) return {};
    const order = ['build', 'test', 'scan', 'deploy'];
    const grouped = jobs.reduce((acc, job) => {
      if (!acc[job.stage]) acc[job.stage] = [];
      acc[job.stage].push(job);
      return acc;
    }, {} as Record<string, Job[]>);

    const sortedStages: Record<string, Job[]> = {};
    const uniqueStages = Array.from(new Set([...order, ...Object.keys(grouped)]));

    uniqueStages.forEach(stage => {
      if (grouped[stage]) {
        sortedStages[stage] = grouped[stage];
      }
    });

    return sortedStages;
  }, [jobs]);

  const activeLogs = showDeploymentLogs
    ? deployLogs?.map(l => l.content)
    : jobLogs?.map(l => l.content);

  const activeTitle = showDeploymentLogs
    ? `Deployment Logs`
    : selectedJob
      ? `${selectedJob.name} Logs`
      : null;

  if (isPipelineLoading || isJobsLoading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!pipeline) return <div className="p-8 text-center text-muted-foreground">Pipeline not found</div>;

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] animate-in fade-in duration-500">
      {/* Header */}
      <div className="bg-background border-b border-border px-6 py-4 flex-none space-y-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link to={`/projects/${pId}`} className="hover:text-primary transition-colors">Project #{pId}</Link>
          <ChevronRight size={14} />
          <span className="text-foreground">Pipeline #{pipeId}</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Badge variant="outline" className={cn(
              "pl-2 pr-2.5 py-1 text-sm border",
              pipeline.status === 'success' ? "border-green-200 bg-green-50 text-green-700 hover:bg-green-100" :
                pipeline.status === 'failed' ? "border-red-200 bg-red-50 text-red-700 hover:bg-red-100" :
                  pipeline.status === 'running' ? "border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100" :
                    "bg-muted/50 text-muted-foreground"
            )}>
              <StatusIcon status={pipeline.status} />
              <span className="capitalize ml-1.5">{pipeline.status}</span>
            </Badge>

            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <GitCommit size={16} />
                <span className="font-mono text-foreground">{pipeline.commit_hash?.substring(0, 8) || 'Manual'}</span>
              </div>
              <div className="flex items-center gap-2">
                <GitBranch size={16} />
                <span className="text-foreground">{pipeline.branch}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock size={16} />
                <span>{formatDistanceToNow(new Date(pipeline.created_at), { addSuffix: true })}</span>
              </div>
            </div>
          </div>

          {deployment && (
            <Button
              variant={showDeploymentLogs ? "secondary" : "outline"}
              onClick={() => {
                setSelectedJob(null);
                setShowDeploymentLogs(true);
              }}
              className={cn(
                "gap-2",
                showDeploymentLogs && "bg-purple-50 text-purple-700 hover:bg-purple-100 border-purple-200"
              )}
            >
              <Server size={16} />
              Deployment: <span className="capitalize">{deployment.status}</span>
            </Button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Pipeline Graph (Left/Top) */}
        <div className="flex-1 bg-muted/30 overflow-x-auto overflow-y-auto">
          <div className="p-8">
            <div className="flex gap-12 min-w-max pb-8">
              {Object.entries(stages).map(([stageName, stageJobs], index, arr) => (
                <div key={stageName} className="flex flex-col gap-4 w-48 relative">
                  {/* Stage Header */}
                  <div className="flex items-center justify-center mb-2">
                    <Badge variant="secondary" className="uppercase text-xs font-bold tracking-wide">
                      {stageName}
                    </Badge>
                  </div>

                  {/* Connection Line to Next Stage */}
                  {(index < arr.length - 1 || (index === arr.length - 1 && deployment)) && (
                    <div className="hidden md:block absolute top-20 left-full w-12 h-0.5 bg-border -translate-y-1/2 z-0" />
                  )}

                  {/* Jobs List */}
                  <div className="flex flex-col gap-3 relative z-10">
                    {stageJobs.map((job) => (
                      <JobCard
                        key={job.id}
                        job={job}
                        isActive={selectedJob?.id === job.id}
                        onClick={() => {
                          setShowDeploymentLogs(false);
                          setSelectedJob(job);
                        }}
                      />
                    ))}
                  </div>
                </div>
              ))}

              {/* Deployment Node (Visual) */}
              {deployment && (
                <div className="flex flex-col gap-4 w-48 relative">
                  <div className="flex items-center justify-center mb-2">
                    <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-200 border-purple-200 uppercase text-xs font-bold tracking-wide">
                      Production
                    </Badge>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedJob(null);
                      setShowDeploymentLogs(true);
                    }}
                    className={cn(
                      "w-full text-left p-3 rounded-lg border transition-all relative bg-card",
                      showDeploymentLogs
                        ? "border-purple-500 ring-1 ring-purple-500 bg-purple-50/20"
                        : "border-border hover:border-purple-300 hover:shadow-sm"
                    )}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm text-foreground">Deploy</span>
                      <StatusIcon status={deployment.status} />
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Server size={12} />
                      {deployment.started_at
                        ? formatDistanceToNow(new Date(deployment.started_at), { addSuffix: true })
                        : 'Pending'
                      }
                    </div>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Logs Panel (Right/Bottom) */}
        {(selectedJob || showDeploymentLogs) && (
          <div className="h-96 w-full border-t border-border bg-[#1e1e1e] flex flex-col shadow-xl flex-none transition-all duration-300">
            <div className="flex items-center justify-between px-4 py-3 bg-[#252526] border-b border-[#3e3e3e]">
              <div className="flex items-center gap-2 text-gray-200">
                <Terminal size={16} />
                <span className="font-mono text-sm">{activeTitle}</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setSelectedJob(null);
                  setShowDeploymentLogs(false);
                }}
                className="h-6 w-6 text-gray-400 hover:text-white hover:bg-transparent"
              >
                <X size={16} />
              </Button>
            </div>

            <div className="flex-1 overflow-auto p-4 font-mono text-xs leading-relaxed">
              {activeLogs && activeLogs.length > 0 ? (
                activeLogs.map((log, i) => (
                  <div key={i} className="text-gray-300 whitespace-pre-wrap break-all border-l-2 border-transparent pl-2 hover:bg-[#2a2d2e]">
                    <span className="text-[#569cd6] mr-3 select-none opacity-50">{i + 1}</span>
                    {log}
                  </div>
                ))
              ) : (
                <div className="text-gray-500 italic">No logs available yet...</div>
              )}
              <div ref={logsEndRef} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
