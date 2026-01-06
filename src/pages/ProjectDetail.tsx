import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getProject, getPipelines, triggerPipeline, updateProject, api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
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
  Settings,
  Users,
  UserPlus,
  Trash2,
  Shield
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ProjectMember {
  user_id: number;
  project_id: number;
  role: string;
  joined_at: string;
  user: {
    id: number;
    email: string;
    name: string;
    avatar_url: string;
  };
}



function TeamDialog({
  project,
  members,
  currentUser,
  open,
  onOpenChange,
  onInvite,
  onRemove,
  isInvitePending
}: {
  project: any,
  members: ProjectMember[] | undefined,
  currentUser: any,
  open: boolean,
  onOpenChange: (open: boolean) => void,
  onInvite: (email: string) => void,
  onRemove: (userId: number) => void,
  isInvitePending: boolean
}) {
  const [email, setEmail] = React.useState('');

  const handleInvite = () => {
    onInvite(email);
    setEmail('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Team Management</DialogTitle>
          <DialogDescription>
            Manage collaborators and their access to {project.name}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
           {currentUser?.id === project.owner_id && (
            <div className="flex items-end gap-3">
              <div className="space-y-2 flex-1">
                <Label htmlFor="email">Invite by Email</Label>
                <Input
                  id="email"
                  placeholder="colleague@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <Button
                onClick={handleInvite}
                disabled={!email || isInvitePending}
              >
                {isInvitePending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
                Invite
              </Button>
            </div>
           )}

           {currentUser?.id === project.owner_id && <Separator />}

           <div className="space-y-3">
              <h4 className="text-sm font-medium text-muted-foreground">Active Members</h4>
              <div className="space-y-2">
                {members?.map((member) => (
                  <div key={member.user_id} className="flex items-center justify-between p-3 rounded-lg border bg-card/50">
                    <div className="flex items-center gap-3">
                        {member.user.avatar_url ? (
                          <img src={member.user.avatar_url} alt={member.user.name} className="h-8 w-8 rounded-full" />
                        ) : (
                          <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center">
                            <span className="font-bold text-xs">{member.user.name?.charAt(0).toUpperCase()}</span>
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-medium">{member.user.name} {currentUser?.id === member.user.id && <span className="text-muted-foreground">(You)</span>}</p>
                          <p className="text-xs text-muted-foreground">{member.user.email}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Badge variant="outline" className="capitalize">
                          {member.role}
                        </Badge>
                        {currentUser?.id === project.owner_id && member.user.id !== currentUser.id && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => onRemove(member.user.id)}
                          >
                            <Trash2 size={14} />
                          </Button>
                        )}
                    </div>
                  </div>
                ))}
              </div>
           </div>
        </div>
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
  const [isTeamOpen, setIsTeamOpen] = React.useState(false);
  const { user } = useAuth();

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

  const { data: members, refetch: refetchMembers } = useQuery({
    queryKey: ['members', projectId],
    queryFn: async () => {
      const { data } = await api.get<ProjectMember[]>(`/projects/${projectId}/members`);
      return data;
    },
    enabled: !!projectId,
  });

  const triggerMutation = useMutation({
    mutationFn: () => triggerPipeline(projectId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pipelines', projectId] });
    },
  });

  const inviteMutation = useMutation({
    mutationFn: (email: string) => api.post(`/projects/${projectId}/members`, { email, role: 'viewer' }),
    onSuccess: () => {
      refetchMembers();
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: (userId: number) => api.delete(`/projects/${projectId}/members/${userId}`),
    onSuccess: () => {
      refetchMembers();
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
        
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setIsTeamOpen(true)} className="gap-2">
              <Users className="h-4 w-4" />
              Team
          </Button>
          {user?.id === project.owner_id && (
            <Button variant="outline" size="icon" asChild>
                <Link to={`/projects/${projectId}/settings`}>
                    <Settings className="h-4 w-4" />
                </Link>
            </Button>
          )}
          <Button
              onClick={() => triggerMutation.mutate()}
              disabled={triggerMutation.isPending}
          >
              {triggerMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                  <Play className="mr-2 h-4 w-4" />
              )}
              Run Pipeline
          </Button>
        </div>
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



      <TeamDialog 
        project={project} 
        members={members}
        currentUser={user}
        open={isTeamOpen} 
        onOpenChange={setIsTeamOpen}
        onInvite={(email) => inviteMutation.mutate(email)}
        onRemove={(userId) => removeMemberMutation.mutate(userId)}
        isInvitePending={inviteMutation.isPending}
      />
    </div>
  );
}