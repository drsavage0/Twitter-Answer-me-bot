import React, { useState } from 'react';
import { Header } from '@/components/layout/header';
import { Sidebar } from '@/components/layout/sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useBotStatus } from '@/hooks/use-bot-status';
import { toast } from '@/hooks/use-toast';

export default function Settings() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { status, toggleBotActive, connectTwitter, configureOpenAI } = useBotStatus();
  const [twitterCreds, setTwitterCreds] = useState({
    accessToken: '',
    accessSecret: '',
    apiKey: '',
    apiSecret: '',
  });
  const [openaiKey, setOpenaiKey] = useState('');

  const handleMobileMenuToggle = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleTwitterConnect = async () => {
    if (!twitterCreds.accessToken || !twitterCreds.accessSecret || 
        !twitterCreds.apiKey || !twitterCreds.apiSecret) {
      toast({
        title: 'Incomplete Fields',
        description: 'Please fill in all Twitter API credential fields',
        variant: 'destructive',
      });
      return;
    }

    try {
      await connectTwitter.mutateAsync(twitterCreds);
      setTwitterCreds({
        accessToken: '',
        accessSecret: '',
        apiKey: '',
        apiSecret: '',
      });
    } catch (error) {
      console.error('Error connecting to Twitter:', error);
    }
  };

  const handleOpenAIConfigure = async () => {
    if (!openaiKey) {
      toast({
        title: 'Missing API Key',
        description: 'Please enter your OpenAI API key',
        variant: 'destructive',
      });
      return;
    }

    try {
      await configureOpenAI.mutateAsync({ apiKey: openaiKey });
      setOpenaiKey('');
    } catch (error) {
      console.error('Error configuring OpenAI:', error);
    }
  };

  const handleToggleActive = async () => {
    try {
      await toggleBotActive.mutateAsync();
    } catch (error) {
      console.error('Error toggling bot status:', error);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-twitter-dark text-twitter-text-primary">
      <Header 
        status={status} 
        onMobileMenuToggle={handleMobileMenuToggle} 
      />
      
      <div className="flex flex-1 overflow-hidden">
        <Sidebar isOpen={isMobileMenuOpen} />
        
        <main className="flex-1 overflow-y-auto p-4">
          <h1 className="text-2xl font-bold mb-6">Settings</h1>
          
          <div className="space-y-6">
            <Card className="bg-twitter-darker border-twitter-border">
              <CardHeader>
                <CardTitle className="text-twitter-text-primary">Bot Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium mb-1">Automatic Responses</h3>
                    <p className="text-sm text-twitter-text-secondary">
                      When enabled, the bot will automatically respond to mentions
                    </p>
                  </div>
                  <Switch 
                    checked={status.active}
                    onCheckedChange={handleToggleActive}
                    disabled={!status.connected || toggleBotActive.isPending}
                  />
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-twitter-darker border-twitter-border">
              <CardHeader>
                <CardTitle className="text-twitter-text-primary">Twitter API Configuration</CardTitle>
              </CardHeader>
              <CardContent>
                {status.connected ? (
                  <div>
                    <div className="flex items-center text-green-400 mb-4">
                      <i className="fas fa-check-circle mr-2"></i>
                      <span>Connected as @{status.username}</span>
                    </div>
                    <Button 
                      variant="outline" 
                      className="border-twitter-border text-twitter-blue"
                      onClick={() => toast({
                        title: 'Reconfiguration',
                        description: 'To reconfigure Twitter API keys, please restart the application'
                      })}
                    >
                      Reconfigure
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="apiKey">API Key</Label>
                        <Input 
                          id="apiKey" 
                          value={twitterCreds.apiKey}
                          onChange={e => setTwitterCreds({...twitterCreds, apiKey: e.target.value})}
                          className="bg-gray-800 border-twitter-border"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="apiSecret">API Secret</Label>
                        <Input 
                          id="apiSecret" 
                          type="password"
                          value={twitterCreds.apiSecret}
                          onChange={e => setTwitterCreds({...twitterCreds, apiSecret: e.target.value})}
                          className="bg-gray-800 border-twitter-border"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="accessToken">Access Token</Label>
                        <Input 
                          id="accessToken" 
                          value={twitterCreds.accessToken}
                          onChange={e => setTwitterCreds({...twitterCreds, accessToken: e.target.value})}
                          className="bg-gray-800 border-twitter-border"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="accessSecret">Access Secret</Label>
                        <Input 
                          id="accessSecret" 
                          type="password"
                          value={twitterCreds.accessSecret}
                          onChange={e => setTwitterCreds({...twitterCreds, accessSecret: e.target.value})}
                          className="bg-gray-800 border-twitter-border"
                        />
                      </div>
                    </div>
                    
                    <div className="flex justify-end">
                      <Button 
                        onClick={handleTwitterConnect}
                        className="bg-twitter-blue hover:bg-twitter-blue/90"
                        disabled={connectTwitter.isPending}
                      >
                        {connectTwitter.isPending ? 'Connecting...' : 'Connect to Twitter'}
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card className="bg-twitter-darker border-twitter-border">
              <CardHeader>
                <CardTitle className="text-twitter-text-primary">OpenAI Configuration</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="openaiKey">OpenAI API Key</Label>
                    <Input 
                      id="openaiKey" 
                      type="password"
                      value={openaiKey}
                      onChange={e => setOpenaiKey(e.target.value)}
                      className="bg-gray-800 border-twitter-border"
                      placeholder="sk-..."
                    />
                    <p className="text-xs text-twitter-text-secondary">
                      The API key is used to generate responses using GPT-4o
                    </p>
                  </div>
                  
                  <div className="flex justify-end">
                    <Button 
                      onClick={handleOpenAIConfigure}
                      className="bg-twitter-blue hover:bg-twitter-blue/90"
                      disabled={configureOpenAI.isPending}
                    >
                      {configureOpenAI.isPending ? 'Saving...' : 'Save API Key'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-twitter-darker border-twitter-border">
              <CardHeader>
                <CardTitle className="text-twitter-text-primary">Response Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium mb-1">Witty Mode</h3>
                      <p className="text-sm text-twitter-text-secondary">
                        Clever, humorous responses
                      </p>
                    </div>
                    <Switch defaultChecked={true} />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium mb-1">Roast Mode</h3>
                      <p className="text-sm text-twitter-text-secondary">
                        Gentle roasts and comebacks
                      </p>
                    </div>
                    <Switch defaultChecked={true} />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium mb-1">Debate Mode</h3>
                      <p className="text-sm text-twitter-text-secondary">
                        Logical counter-arguments
                      </p>
                    </div>
                    <Switch defaultChecked={true} />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium mb-1">Peace Mode</h3>
                      <p className="text-sm text-twitter-text-secondary">
                        De-escalation responses
                      </p>
                    </div>
                    <Switch defaultChecked={true} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
