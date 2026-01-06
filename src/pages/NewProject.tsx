import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { createProject } from '../lib/api';
import type { NewProject as NewProjectType } from '../lib/api';
import { Save, Loader2, ArrowLeft, Github, Server, Box, FileCode } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export function NewProject() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<NewProjectType>({
    name: '',
    repo_url: '',
    access_token: '',
    pipeline_filename: 'pipeline.yml',
    deployment_filename: 'docker-compose.yml',
    ssh_host: '',
    ssh_user: '',
    ssh_private_key: '',
    registry_user: '',
    registry_token: ''
  });

  const mutation = useMutation({
    mutationFn: createProject,
    onSuccess: (data) => {
      navigate(`/projects/${data.id}`);
    },
    onError: (err: any) => {
      setError(err.response?.data?.error || 'Failed to create project');
    }
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    mutation.mutate(formData);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-10">
      <div className="space-y-4">
        <Button variant="ghost" size="sm" asChild className="-ml-2 text-muted-foreground hover:text-foreground">
          <Link to="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Projects
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create New Project</h1>
          <p className="text-muted-foreground mt-1">Connect a repository to start building pipelines.</p>
        </div>
      </div>

      <Separator />

      {error && (
        <div className="p-4 rounded-lg bg-destructive/10 text-destructive border border-destructive/20 text-sm font-medium">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Repository Details */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="p-2 bg-primary/10 rounded-lg text-primary">
                <Github className="h-5 w-5" />
              </div>
              <div>
                <CardTitle>Repository Details</CardTitle>
                <CardDescription>
                  Configure the source control connection for your project.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Project Name <span className="text-destructive">*</span></Label>
              <Input
                id="name"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                placeholder="My Awesome Project"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="repo_url">Git Repository URL <span className="text-destructive">*</span></Label>
              <Input
                type="url"
                id="repo_url"
                name="repo_url"
                required
                value={formData.repo_url}
                onChange={handleChange}
                placeholder="https://github.com/username/repo.git"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="access_token">Personal Access Token</Label>
              <Input
                type="password"
                id="access_token"
                name="access_token"
                value={formData.access_token}
                onChange={handleChange}
                placeholder="ghp_..."
              />
              <p className="text-xs text-muted-foreground">
                Required for private repositories (GitHub PAT, GitLab Token, etc.)
              </p>
            </div>
          </CardContent>
        </Card>

        {/* SSH Config */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="p-2 bg-primary/10 rounded-lg text-primary">
                <Server className="h-5 w-5" />
              </div>
              <div>
                <CardTitle>Deployment Server</CardTitle>
                <CardDescription>
                  Configure the remote server where your application will be deployed via SSH.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ssh_host">SSH Host (IP:Port)</Label>
                <Input
                  id="ssh_host"
                  name="ssh_host"
                  value={formData.ssh_host}
                  onChange={handleChange}
                  placeholder="192.168.1.10:22"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ssh_user">SSH Username</Label>
                <Input
                  id="ssh_user"
                  name="ssh_user"
                  value={formData.ssh_user}
                  onChange={handleChange}
                  placeholder="ubuntu"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ssh_private_key">SSH Private Key</Label>
              <Textarea
                id="ssh_private_key"
                name="ssh_private_key"
                rows={6}
                value={formData.ssh_private_key}
                onChange={handleChange}
                placeholder="-----BEGIN OPENSSH PRIVATE KEY-----..."
                className="font-mono text-xs"
              />
              <p className="text-xs text-muted-foreground">
                The private key used to authenticate with the deployment server.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Registry Config */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="p-2 bg-primary/10 rounded-lg text-primary">
                <Box className="h-5 w-5" />
              </div>
              <div>
                <CardTitle>Container Registry</CardTitle>
                <CardDescription>
                  Credentials to push Docker images during the build process.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="registry_user">Registry Username</Label>
                <Input
                  id="registry_user"
                  name="registry_user"
                  value={formData.registry_user}
                  onChange={handleChange}
                  placeholder="dockerhub-user"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="registry_token">Registry Token / Password</Label>
                <Input
                  type="password"
                  id="registry_token"
                  name="registry_token"
                  value={formData.registry_token}
                  onChange={handleChange}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Configuration Files */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="p-2 bg-primary/10 rounded-lg text-primary">
                <FileCode className="h-5 w-5" />
              </div>
              <div>
                <CardTitle>File Configuration</CardTitle>
                <CardDescription>
                  Customize filenames for your CI/CD pipeline and deployment.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="pipeline_filename">Pipeline Filename</Label>
                <Input
                  id="pipeline_filename"
                  name="pipeline_filename"
                  value={formData.pipeline_filename}
                  onChange={handleChange}
                  placeholder="pipeline.yml"
                  className="font-mono"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="deployment_filename">Deployment Filename</Label>
                <Input
                  id="deployment_filename"
                  name="deployment_filename"
                  value={formData.deployment_filename}
                  onChange={handleChange}
                  placeholder="docker-compose.yml"
                  className="font-mono"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end pt-4">
          <Button type="submit" size="lg" disabled={mutation.isPending}>
            {mutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Create Project
          </Button>
        </div>
      </form>
    </div>
  );
}