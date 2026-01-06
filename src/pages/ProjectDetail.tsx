import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getProject, getPipelines, triggerPipeline, updateProject } from '../lib/api';
import type { NewProject } from '../lib/api';
import { 
  GitCommit, 
  GitBranch, 
  Clock, 
  Play, 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  ExternalLink,
  Box,
  Github,
  Settings
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

function EditProjectDialog({ project, open, onOpenChange }: { project: any, open: boolean, onOpenChange: (open: boolean) => void }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = React.useState<NewProject>({
    name: project.name,
    repo_url: project.repo_url,
    access_token: project.access_token,
    pipeline_filename: project.pipeline_filename || '.gitlab-ci.yml',
    deployment_filename: project.deployment_filename || 'docker-compose.yml',
    ssh_host: project.ssh_host || '',
    ssh_user: project.ssh_user || '',
    ssh_private_key: project.ssh_private_key || '',
    registry_user: project.registry_user || '',
    registry_token: project.registry_token || '',
    sonar_url: project.sonar_url || '',
    sonar_token: project.sonar_token || '',
  });

  const updateMutation = useMutation({
    mutationFn: () => updateProject(project.id, formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', project.id] });
      onOpenChange(false);
    },
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Project Settings</DialogTitle>
          <DialogDescription>
            Update project details, repository access, and deployment credentials.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-6 py-4">
          <div className="space-y-4">
            <h3 className="text-sm font-medium leading-none text-muted-foreground">General Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Project Name</Label>
                <Input id="name" name="name" value={formData.name} onChange={handleChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="repo_url">Repository URL</Label>
                <Input id="repo_url" name="repo_url" value={formData.repo_url} onChange={handleChange} />
              </div>
            </div>
             <div className="space-y-2">
                <Label htmlFor="access_token">Git Access Token</Label>
                <Input id="access_token" name="access_token" type="password" value={formData.access_token} onChange={handleChange} />
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
             <h3 className="text-sm font-medium leading-none text-muted-foreground">CI/CD Configuration</h3>
             <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="pipeline_filename">Pipeline Filename</Label>
                    <Input id="pipeline_filename" name="pipeline_filename" value={formData.pipeline_filename} onChange={handleChange} placeholder=".gitlab-ci.yml" />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="deployment_filename">Deployment Filename</Label>
                    <Input id="deployment_filename" name="deployment_filename" value={formData.deployment_filename} onChange={handleChange} placeholder="docker-compose.yml" />
                </div>
             </div>
          </div>

          <Separator />

           <div className="space-y-4">
             <h3 className="text-sm font-medium leading-none text-muted-foreground">Container Registry</h3>
             <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="registry_user">Registry User</Label>
                    <Input id="registry_user" name="registry_user" value={formData.registry_user} onChange={handleChange} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="registry_token">Registry Token</Label>
                    <Input id="registry_token" name="registry_token" type="password" value={formData.registry_token} onChange={handleChange} />
                </div>
             </div>
          </div>

          <Separator />

          <div className="space-y-4">
             <h3 className="text-sm font-medium leading-none text-muted-foreground">Code Quality (SonarQube)</h3>
             <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="sonar_url">Sonar Host URL</Label>
                    <Input id="sonar_url" name="sonar_url" value={formData.sonar_url} onChange={handleChange} placeholder="e.g. http://localhost:9000" />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="sonar_token">Sonar Token</Label>
                    <Input id="sonar_token" name="sonar_token" type="password" value={formData.sonar_token} onChange={handleChange} />
                </div>
             </div>
          </div>

          <Separator />

          <div className="space-y-4">
             <h3 className="text-sm font-medium leading-none text-muted-foreground">SSH Deployment</h3>
             <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="ssh_host">SSH Host</Label>
                    <Input id="ssh_host" name="ssh_host" value={formData.ssh_host} onChange={handleChange} placeholder="e.g. 192.168.1.10" />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="ssh_user">SSH User</Label>
                    <Input id="ssh_user" name="ssh_user" value={formData.ssh_user} onChange={handleChange} placeholder="e.g. root" />
                </div>
             </div>
             <div className="space-y-2">
                <Label htmlFor="ssh_private_key">SSH Private Key</Label>
                <Textarea 
                    id="ssh_private_key" 
                    name="ssh_private_key" 
                    value={formData.ssh_private_key} 
                    onChange={handleChange} 
                    className="font-mono text-xs h-24"
                    placeholder="-----BEGIN OPENSSH PRIVATE KEY-----" 
                />
            </div>
          </div>
        </div>

        <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={() => updateMutation.mutate()} disabled={updateMutation.isPending}>
                {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const StatusBadge = ({ status }: { status: string }) => {
  const styles = {
    success: "bg-green-500/15 text-green-700 hover:bg-green-500/25 border-green-200",
    failed: "bg-red-500/15 text-red-700 hover:bg-red-500/25 border-red-200",
    running: "bg-blue-500/15 text-blue-700 hover:bg-blue-500/25 border-blue-200",
    pending: "bg-gray-500/15 text-gray-700 hover:bg-gray-500/25 border-gray-200",
  };

  const icons = {
    success: <CheckCircle2 size={12} className="mr-1" />,
    failed: <XCircle size={12} className="mr-1" />,
    running: <Loader2 size={12} className="mr-1 animate-spin" />,
    pending: <Clock size={12} className="mr-1" />,
  };

  const s = status as keyof typeof styles;

  return (
    <Badge variant="outline" className={`pl-2 pr-2.5 py-0.5 border ${styles[s] || styles.pending}`}>
      {icons[s] || icons.pending}
      <span className="capitalize">{status}</span>
    </Badge>
  );
};

export function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const projectId = parseInt(id || '0');
  const queryClient = useQueryClient();
  const [isEditOpen, setIsEditOpen] = React.useState(false);

  const { data: project, isLoading: isProjectLoading } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => getProject(projectId),
    enabled: !!projectId,
  });

  const { data: pipelines, isLoading: isPipelinesLoading } = useQuery({
    queryKey: ['pipelines', projectId],
    queryFn: () => getPipelines(projectId),
    enabled: !!projectId,
    refetchInterval: 5000,
  });

  const triggerMutation = useMutation({
    mutationFn: () => triggerPipeline(projectId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pipelines', projectId] });
    },
  });

  if (isProjectLoading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="p-4 rounded-lg bg-destructive/10 text-destructive border border-destructive/20 text-sm font-medium">
        Project not found
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div className="space-y-1">
            <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold tracking-tight text-foreground">{project.name}</h1>
                <Badge variant="secondary" className="font-mono text-xs">ID: {project.id}</Badge>
                <Button variant="ghost" size="icon" onClick={() => setIsEditOpen(true)}>
                    <Settings className="h-4 w-4" />
                </Button>
            </div>
            
            <a 
              href={project.repo_url} 
              target="_blank" 
              rel="noreferrer"
              className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors text-sm"
            >
              <Github size={14} />
              {project.repo_url}
              <ExternalLink size={12} />
            </a>
        </div>
        
        <Button
            onClick={() => triggerMutation.mutate()}
            disabled={triggerMutation.isPending}
            size="lg"
        >
            {triggerMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
                <Play className="mr-2 h-4 w-4" />
            )}
            Run Pipeline
        </Button>
      </div>

      {/* Project Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
            <CardContent className="p-4 flex items-center gap-4">
                <div className="p-2 bg-primary/10 rounded-lg text-primary">
                    <GitBranch className="h-5 w-5" />
                </div>
                <div>
                    <p className="text-sm font-medium leading-none">Default Branch</p>
                    <p className="text-sm text-muted-foreground mt-1">main</p>
                </div>
            </CardContent>
        </Card>
        <Card>
            <CardContent className="p-4 flex items-center gap-4">
                <div className="p-2 bg-primary/10 rounded-lg text-primary">
                    <Box className="h-5 w-5" />
                </div>
                <div>
                    <p className="text-sm font-medium leading-none">Docker Registry</p>
                    <p className="text-sm text-muted-foreground mt-1">{ project.registry_user }</p>
                </div>
            </CardContent>
        </Card>
      </div>

      <Separator />

      {/* Pipelines List */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-xl font-semibold tracking-tight">Pipeline History</h2>
        </div>
        
        <Card>
            {isPipelinesLoading ? (
                 <div className="p-8 text-center text-muted-foreground">Loading pipelines...</div>
            ) : pipelines?.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="rounded-full bg-muted p-4 mb-4">
                        <Play className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold">No pipelines run yet</h3>
                    <p className="text-sm text-muted-foreground mt-1">Trigger your first pipeline to get started.</p>
                </div>
            ) : (
                <div className="divide-y divide-border">
                    {pipelines?.map((pipeline) => (
                        <Link 
                            key={pipeline.id} 
                            to={`/projects/${project.id}/pipelines/${pipeline.id}`}
                            className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors group"
                        >
                            <div className="flex items-center gap-4">
                                <StatusBadge status={pipeline.status} />
                                
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <span className="font-semibold text-sm">#{pipeline.id}</span>
                                        <span className="text-muted-foreground">|</span>
                                        <div className="flex items-center gap-1 text-sm text-muted-foreground font-mono bg-muted px-1.5 py-0.5 rounded">
                                            <GitCommit size={12} />
                                            {pipeline.commit_hash ? pipeline.commit_hash.substring(0, 8) : 'Manual'}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                        <span className="flex items-center gap-1">
                                            <GitBranch size={12} />
                                            {pipeline.branch}
                                        </span>
                                        <span>•</span>
                                        <span className="flex items-center gap-1">
                                            <Clock size={12} />
                                            {formatDistanceToNow(new Date(pipeline.created_at), { addSuffix: true })}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <ExternalLink size={16} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                        </Link>
                    ))}
                </div>
            )}
        </Card>
      </div>

      <EditProjectDialog project={project} open={isEditOpen} onOpenChange={setIsEditOpen} />
    </div>
  );
}