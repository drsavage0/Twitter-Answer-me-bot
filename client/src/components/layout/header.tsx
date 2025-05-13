import React from 'react';
import { Button } from '@/components/ui/button';
import { 
  Dialog, 
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { BotStatus } from '@/lib/types';
import { useBotStatus } from '@/hooks/use-bot-status';
import { useState } from 'react';

interface HeaderProps {
  status: BotStatus;
  onMobileMenuToggle: () => void;
}

export function Header({ status, onMobileMenuToggle }: HeaderProps) {
  const { connectTwitter, configureOpenAI } = useBotStatus();
  const [credentials, setCredentials] = useState({
    accessToken: '',
    accessSecret: '',
    apiKey: '',
    apiSecret: '',
  });
  const [openaiKey, setOpenaiKey] = useState('');
  const [isSettingUpTwitter, setIsSettingUpTwitter] = useState(false);
  const [isSettingUpOpenAI, setIsSettingUpOpenAI] = useState(false);

  const handleTwitterConnect = async () => {
    try {
      await connectTwitter.mutateAsync(credentials);
      setIsSettingUpTwitter(false);
    } catch (error) {
      console.error('Error connecting to Twitter:', error);
    }
  };

  const handleOpenAISetup = async () => {
    try {
      await configureOpenAI.mutateAsync({ apiKey: openaiKey });
      setIsSettingUpOpenAI(false);
    } catch (error) {
      console.error('Error setting up OpenAI:', error);
    }
  };

  return (
    <header className="sticky top-0 z-10 bg-twitter-dark/80 backdrop-blur-md border-b border-twitter-border px-4 py-3 flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <button 
          className="md:hidden text-twitter-text-primary p-2 rounded-full hover:bg-gray-800"
          onClick={onMobileMenuToggle}
        >
          <i className="fas fa-bars"></i>
        </button>
        <div className="flex items-center">
          <i className="fas fa-robot text-twitter-blue text-xl mr-2"></i>
          <h1 className="text-xl font-bold">@answerthembot</h1>
        </div>
      </div>
      <div className="flex items-center space-x-4">
        <Dialog>
          <DialogTrigger asChild>
            <Button className="bg-twitter-blue hover:bg-twitter-blue/90 text-white px-4 py-1.5 rounded-full font-medium text-sm">
              {status.connected ? 'Setup API Keys' : 'Connect Twitter'}
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-twitter-darker border-twitter-border">
            <DialogHeader>
              <DialogTitle className="text-twitter-text-primary">Setup API Keys</DialogTitle>
              <DialogDescription className="text-twitter-text-secondary">
                Configure your Twitter and OpenAI API keys to enable the bot
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6 py-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-twitter-text-primary">Twitter API</h3>
                  {status.connected && (
                    <div className="text-green-400 flex items-center text-sm">
                      <i className="fas fa-check-circle mr-1"></i>
                      Connected as @{status.username}
                    </div>
                  )}
                </div>
                
                {!status.connected && !isSettingUpTwitter && (
                  <Button 
                    variant="outline" 
                    className="w-full border-twitter-border text-twitter-blue"
                    onClick={() => setIsSettingUpTwitter(true)}
                  >
                    Setup Twitter API Keys
                  </Button>
                )}
                
                {isSettingUpTwitter && (
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor="apiKey" className="text-twitter-text-primary">API Key</Label>
                      <Input 
                        id="apiKey" 
                        value={credentials.apiKey}
                        onChange={e => setCredentials({...credentials, apiKey: e.target.value})}
                        className="bg-gray-800 border-twitter-border text-twitter-text-primary"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="apiSecret" className="text-twitter-text-primary">API Secret</Label>
                      <Input 
                        id="apiSecret" 
                        type="password"
                        value={credentials.apiSecret}
                        onChange={e => setCredentials({...credentials, apiSecret: e.target.value})}
                        className="bg-gray-800 border-twitter-border text-twitter-text-primary"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="accessToken" className="text-twitter-text-primary">Access Token</Label>
                      <Input 
                        id="accessToken" 
                        value={credentials.accessToken}
                        onChange={e => setCredentials({...credentials, accessToken: e.target.value})}
                        className="bg-gray-800 border-twitter-border text-twitter-text-primary"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="accessSecret" className="text-twitter-text-primary">Access Secret</Label>
                      <Input 
                        id="accessSecret" 
                        type="password"
                        value={credentials.accessSecret}
                        onChange={e => setCredentials({...credentials, accessSecret: e.target.value})}
                        className="bg-gray-800 border-twitter-border text-twitter-text-primary"
                      />
                    </div>
                    
                    <div className="flex justify-end space-x-2 pt-2">
                      <Button 
                        variant="outline" 
                        onClick={() => setIsSettingUpTwitter(false)}
                        className="border-twitter-border"
                      >
                        Cancel
                      </Button>
                      <Button 
                        onClick={handleTwitterConnect}
                        className="bg-twitter-blue hover:bg-twitter-blue/90"
                        disabled={connectTwitter.isPending}
                      >
                        {connectTwitter.isPending ? 'Connecting...' : 'Connect'}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-twitter-text-primary">OpenAI API</h3>
                
                {!isSettingUpOpenAI && (
                  <Button 
                    variant="outline" 
                    className="w-full border-twitter-border text-twitter-blue"
                    onClick={() => setIsSettingUpOpenAI(true)}
                  >
                    Setup OpenAI API Key
                  </Button>
                )}
                
                {isSettingUpOpenAI && (
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor="openaiKey" className="text-twitter-text-primary">OpenAI API Key</Label>
                      <Input 
                        id="openaiKey" 
                        type="password"
                        value={openaiKey}
                        onChange={e => setOpenaiKey(e.target.value)}
                        className="bg-gray-800 border-twitter-border text-twitter-text-primary"
                      />
                    </div>
                    
                    <div className="flex justify-end space-x-2 pt-2">
                      <Button 
                        variant="outline" 
                        onClick={() => setIsSettingUpOpenAI(false)}
                        className="border-twitter-border"
                      >
                        Cancel
                      </Button>
                      <Button 
                        onClick={handleOpenAISetup}
                        className="bg-twitter-blue hover:bg-twitter-blue/90"
                        disabled={configureOpenAI.isPending}
                      >
                        {configureOpenAI.isPending ? 'Saving...' : 'Save API Key'}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <DialogFooter>
              <DialogClose asChild>
                <Button className="bg-gray-800 hover:bg-gray-700 text-twitter-text-primary">
                  Close
                </Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </header>
  );
}
