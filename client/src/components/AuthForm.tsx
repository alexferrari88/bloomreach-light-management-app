import { useState, ChangeEvent, FormEvent } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Auth, AuthFormProps } from '../types';

const AuthForm: React.FC<AuthFormProps> = ({ onLogin }) => {
  const [credentials, setCredentials] = useState<Auth>({
    brxHost: '',
    authToken: ''
  });
  
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCredentials((prev) => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Basic validation
    if (!credentials.brxHost || !credentials.authToken) {
      alert('Please provide both Bloomreach Host and Authentication Token');
      return;
    }
    
    // Ensure brxHost has correct format
    let brxHost = credentials.brxHost;
    if (!brxHost.startsWith('http')) {
      brxHost = `https://${brxHost}`;
    }
    
    // Remove trailing slash if present
    if (brxHost.endsWith('/')) {
      brxHost = brxHost.slice(0, -1);
    }
    
    onLogin({ ...credentials, brxHost });
  };
  
  return (
    <div className="flex justify-center items-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold text-primary">Bloomreach Management App</CardTitle>
          <CardDescription>
            Connect to your Bloomreach instance to manage content types and components
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="brxHost">Bloomreach Host</Label>
              <Input
                id="brxHost"
                name="brxHost"
                value={credentials.brxHost}
                onChange={handleChange}
                placeholder="https://your-bloomreach-host.com"
                required
              />
              <p className="text-xs text-muted-foreground">
                The URL of your Bloomreach instance
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="authToken">Authentication Token</Label>
              <Input
                type="password"
                id="authToken"
                name="authToken"
                value={credentials.authToken}
                onChange={handleChange}
                placeholder="Your x-auth-token"
                required
              />
              <p className="text-xs text-muted-foreground">
                Your Bloomreach API authentication token
              </p>
            </div>
            
            <Button type="submit" className="w-full">
              Connect
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthForm;
