import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getProject, updateProject, deleteProject, getVariables, createVariable, deleteVariable } from '../../lib/api';
import type { NewProject } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ArrowLeft, Save, Trash2, Plus, Lock, Unlock, Check } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function ProjectSettings() {
  const { id } = useParams<{ id: string }>();
  const projectId = parseInt(id || '0');
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  
  const [formData, setFormData] = useState<NewProject>({
    name: '',
    repo_url: '',
    access_token: '',
    pipeline_filename: '',
    deployment_filename: '',
    ssh_host: '',
    ssh_user: '',
    ssh_private_key: '',
    registry_user: '',
    registry_token: '',
    sonar_url: '',
    sonar_token: '',
  });

  const [newVar, setNewVar] = useState({ key: '', value: '', is_secret: false });

  const { data: variables } = useQuery({
    queryKey: ['variables', projectId],
    queryFn: () => getVariables(projectId),
    enabled: !!projectId,
  });

  const createVarMutation = useMutation({
    mutationFn: () => createVariable(projectId, newVar),
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['variables', projectId] });
        setNewVar({ key: '', value: '', is_secret: false });
    }
  });

  const deleteVarMutation = useMutation({
    mutationFn: (key: string) => deleteVariable(projectId, key),
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['variables', projectId] });
    }
  });

  const { data: project, isLoading } = useQuery({
    queryKey: ['project', projectId],
    queryFn: async () => {
      const data = await getProject(projectId);
      // Initialize form data when data is loaded
      setFormData({
        name: data.name,
        repo_url: data.repo_url,
        access_token: data.access_token,
        pipeline_filename: data.pipeline_filename || '.gitlab-ci.yml',
        deployment_filename: data.deployment_filename || 'docker-compose.yml',
        ssh_host: data.ssh_host || '',
        ssh_user: data.ssh_user || '',
        ssh_private_key: data.ssh_private_key || '',
        registry_user: data.registry_user || '',
        registry_token: data.registry_token || '',
        sonar_url: data.sonar_url || '',
        sonar_token: data.sonar_token || '',
      });
      return data;
    },
    enabled: !!projectId,
  });

  const updateMutation = useMutation({
    mutationFn: () => updateProject(projectId, formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
    },
  });

  const deleteProjectMutation = useMutation({
    mutationFn: () => deleteProject(projectId),
    onSuccess: () => {
      navigate('/');
    },
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="p-4 rounded-lg bg-destructive/10 text-destructive border border-destructive/20">
        Project not found
      </div>
    );
  }

  if (user?.id !== project.owner_id) {
      return (
          <div className="p-8 text-center">
              <h2 className="text-2xl font-bold text-destructive">Access Denied</h2>
              <p className="text-muted-foreground mt-2">Only the project owner can access settings.</p>
              <Button asChild className="mt-4">
                  <Link to={`/projects/${projectId}`}>Back to Project</Link>
              </Button>
          </div>
      )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-10">
       <div className="flex items-center gap-4 border-b border-border pb-6">
            <Button variant="ghost" size="icon" asChild>
                <Link to={`/projects/${projectId}`}>
                    <ArrowLeft className="h-5 w-5" />
                </Link>
            </Button>
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Project Settings</h1>
                <p className="text-muted-foreground">Manage configuration for {project.name}</p>
            </div>
       </div>

       <div className="grid gap-8">
            {/* General Information */}
            <section className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold tracking-tight">General Information</h2>
                </div>
                <Card>
                    <CardHeader>
                        <CardTitle>Project Details</CardTitle>
                        <CardDescription>Basic information about your project repository.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                            <Input 
                                id="access_token" 
                                name="access_token" 
                                type="password" 
                                value={formData.access_token} 
                                onChange={handleChange} 
                                placeholder="Leave empty to keep unchanged"
                            />
                        </div>
                    </CardContent>
                </Card>
            </section>

            {/* CI/CD Configuration */}
            <section className="space-y-4">
                <h2 className="text-xl font-semibold tracking-tight">CI/CD Configuration</h2>
                <Card>
                    <CardHeader>
                        <CardTitle>Pipeline & Deployment</CardTitle>
                        <CardDescription>Configure how your pipeline and deployment scripts are detected.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="pipeline_filename">Pipeline Filename</Label>
                                <Input id="pipeline_filename" name="pipeline_filename" value={formData.pipeline_filename} onChange={handleChange} placeholder=".gitlab-ci.yml" className="font-mono" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="deployment_filename">Deployment Filename</Label>
                                <Input id="deployment_filename" name="deployment_filename" value={formData.deployment_filename} onChange={handleChange} placeholder="docker-compose.yml" className="font-mono" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                
                <Card>
                    <CardHeader>
                        <CardTitle>SSH Deployment</CardTitle>
                        <CardDescription>Server credentials for remote deployment via SSH.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                                className="font-mono text-xs h-32"
                                placeholder="-----BEGIN OPENSSH PRIVATE KEY-----" 
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Container Registry</CardTitle>
                        <CardDescription>Credentials for pulling/pushing Docker images.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="registry_user">Registry User</Label>
                                <Input id="registry_user" name="registry_user" value={formData.registry_user} onChange={handleChange} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="registry_token">Registry Token</Label>
                                <Input id="registry_token" name="registry_token" type="password" value={formData.registry_token} onChange={handleChange} />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </section>

            {/* Environment Variables */}
            <section className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold tracking-tight">Environment Variables</h2>
                </div>
                <Card>
                    <CardHeader>
                        <CardTitle>Variables & Secrets</CardTitle>
                        <CardDescription>Define environment variables to be injected into your CI/CD pipeline.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* List Variables */}
                        <div className="rounded-md border">
                            <div className="grid grid-cols-12 border-b bg-muted/50 p-3 text-sm font-medium">
                                <div className="col-span-4">Key</div>
                                <div className="col-span-6">Value</div>
                                <div className="col-span-2 text-right">Actions</div>
                            </div>
                            {variables?.length === 0 ? (
                                <div className="p-4 text-center text-sm text-muted-foreground">
                                    No variables defined yet.
                                </div>
                            ) : (
                                variables?.map((v) => (
                                    <div key={v.key} className="grid grid-cols-12 items-center border-b p-3 text-sm last:border-0">
                                        <div className="col-span-4 font-mono">{v.key}</div>
                                        <div className="col-span-6 font-mono text-muted-foreground truncate">
                                            {v.is_secret ? '••••••••' : v.value}
                                        </div>
                                        <div className="col-span-2 flex justify-end">
                                            <Button 
                                                variant="ghost" 
                                                size="sm" 
                                                onClick={() => deleteVarMutation.mutate(v.key)}
                                                disabled={deleteVarMutation.isPending}
                                                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Add Variable */}
                        <div className="space-y-4 rounded-lg border p-4 bg-muted/20">
                            <h4 className="text-sm font-medium">Add New Variable</h4>
                            <div className="grid gap-4 sm:grid-cols-12">
                                <div className="sm:col-span-4">
                                    <Input 
                                        placeholder="Key (e.g. API_KEY)" 
                                        value={newVar.key}
                                        onChange={(e) => setNewVar(prev => ({ ...prev, key: e.target.value }))}
                                        className="font-mono"
                                    />
                                </div>
                                <div className="sm:col-span-6">
                                    <Input 
                                        placeholder="Value" 
                                        type={newVar.is_secret ? "password" : "text"}
                                        value={newVar.value}
                                        onChange={(e) => setNewVar(prev => ({ ...prev, value: e.target.value }))}
                                        className="font-mono"
                                    />
                                </div>
                                <div className="sm:col-span-2 flex items-center gap-2">
                                    <Button 
                                        onClick={() => setNewVar(prev => ({ ...prev, is_secret: !prev.is_secret }))}
                                        variant="outline"
                                        size="icon"
                                        title={newVar.is_secret ? "Secret (Hidden)" : "Public (Visible)"}
                                    >
                                        {newVar.is_secret ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                                    </Button>
                                    <Button 
                                        onClick={() => createVarMutation.mutate()} 
                                        disabled={!newVar.key || !newVar.value || createVarMutation.isPending}
                                        className="w-full"
                                    >
                                        <Plus className="h-4 w-4 mr-2" /> Add
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </section>

            {/* Danger Zone */}
            <section className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold tracking-tight text-destructive">Danger Zone</h2>
                </div>
                <Card className="border-destructive/50 bg-destructive/5">
                    <CardHeader>
                        <CardTitle className="text-destructive">Delete Project</CardTitle>
                        <CardDescription>
                            Permanently delete this project and all of its data. This action cannot be undone.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button 
                            variant="destructive" 
                            onClick={() => setIsDeleteDialogOpen(true)}
                        >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete Project
                        </Button>
                    </CardContent>
                </Card>
            </section>
       </div>

       <div className="sticky bottom-6 flex justify-end">
         <Button onClick={() => updateMutation.mutate()} disabled={updateMutation.isPending || isSaved} size="lg">
             {updateMutation.isPending ? (
                 <Loader2 className="mr-2 h-4 w-4 animate-spin" />
             ) : isSaved ? (
                 <Check className="mr-2 h-4 w-4" />
             ) : (
                 <Save className="mr-2 h-4 w-4" />
             )}
             {isSaved ? "Saved!" : "Save Changes"}
         </Button>
       </div>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Are you absolutely sure?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete the project
              <span className="font-semibold text-foreground"> {project.name} </span>
              and remove all associated data, including pipelines, jobs, and logs.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
                variant="destructive" 
                onClick={() => deleteProjectMutation.mutate()}
                disabled={deleteProjectMutation.isPending}
            >
              {deleteProjectMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete Project
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}