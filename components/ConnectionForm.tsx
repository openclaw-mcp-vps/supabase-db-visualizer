"use client";

import { useState, type FormEvent } from "react";
import { DatabaseZap, LoaderCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type ConnectionFormProps = {
  isConnecting: boolean;
  onConnect: (connectionString: string) => Promise<void>;
};

export default function ConnectionForm({ isConnecting, onConnect }: ConnectionFormProps) {
  const [connectionString, setConnectionString] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!connectionString.trim()) {
      setLocalError("Paste your Supabase Postgres connection string to continue.");
      return;
    }

    setLocalError(null);

    try {
      await onConnect(connectionString.trim());
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to connect.";
      setLocalError(message);
    }
  }

  return (
    <Card className="border-[#36404d] bg-[#101722]/90">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <DatabaseZap className="h-5 w-5 text-[#58a6ff]" />
          Connect Supabase Database
        </CardTitle>
        <CardDescription>
          Paste your Postgres URL once. We validate connection server-side and load your schema map.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-3" onSubmit={handleSubmit}>
          <label className="block text-sm font-medium text-[#c9d1d9]" htmlFor="connection-string">
            Supabase connection string
          </label>
          <Input
            id="connection-string"
            type="password"
            autoComplete="off"
            spellCheck={false}
            placeholder="postgresql://postgres:[password]@db.xxx.supabase.co:5432/postgres"
            value={connectionString}
            onChange={(event) => setConnectionString(event.target.value)}
          />
          {localError ? <p className="text-sm text-[#ff8a8a]">{localError}</p> : null}
          <Button type="submit" disabled={isConnecting} className="w-full sm:w-auto">
            {isConnecting ? (
              <>
                <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                Connecting...
              </>
            ) : (
              "Connect and introspect"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
