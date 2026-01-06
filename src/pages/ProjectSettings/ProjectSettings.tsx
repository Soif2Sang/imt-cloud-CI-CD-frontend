import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getProject, updateProject } from '../../lib/api';
import type { NewProject } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Loader2, ArrowLeft, Save } from 'lucide-react';

export function ProjectSettings() {
  const { id } = useParams<{ id: string }>();
  const projectId = parseInt(id || '0');
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
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

             {/* Integrations */}
             <section className="space-y-4">
                <h2 className="text-xl font-semibold tracking-tight">Integrations</h2>
                <Card>
                    <CardHeader>
                        <CardTitle>SonarQube</CardTitle>
                        <CardDescription>Connect to SonarQube for code quality analysis.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="sonar_url">Sonar Host URL</Label>
                                <Input id="sonar_url" name="sonar_url" value={formData.sonar_url} onChange={handleChange} placeholder="e.g. http://localhost:9000" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="sonar_token">Sonar Token</Label>
                                <Input id="sonar_token" name="sonar_token" type="password" value={formData.sonar_token} onChange={handleChange} />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </section>
       </div>

       <div className="sticky bottom-6 flex justify-end">
         <Button onClick={() => updateMutation.mutate()} disabled={updateMutation.isPending} size="lg">
             {updateMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
             Save Changes
         </Button>
       </div>
    </div>
  );
}