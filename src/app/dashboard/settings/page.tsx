"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAppContext } from "@/lib/context/AppContext";
import { AlertCircle, RefreshCw, Save } from "lucide-react";

interface FormState {
  tbaApiKey: string;
  eventCode: string;
  matchDataDirectory: string;
  matchDataFile: string;
}

const DEFAULT_FORM_STATE: FormState = {
  tbaApiKey: "",
  eventCode: "",
  matchDataDirectory: "src/data",
  matchDataFile: "scouting-data.json",
};

export default function SettingsPage() {
  const {
    config,
    setConfig,
    refreshConfig,
    configLoading,
    configError,
  } = useAppContext();

  const [formState, setFormState] = useState<FormState>(DEFAULT_FORM_STATE);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (config) {
      setFormState({
        tbaApiKey: config.tbaApiKey ?? "",
        eventCode: config.eventCode ?? "",
        matchDataDirectory: config.matchDataDirectory ?? "src/data",
        matchDataFile: config.matchDataFile ?? "scouting-data.json",
      });
    }
  }, [config]);

  const isDirty = useMemo(() => {
    if (!config) {
      return true;
    }
    return (
      formState.tbaApiKey !== (config.tbaApiKey ?? "") ||
      formState.eventCode !== (config.eventCode ?? "") ||
      formState.matchDataDirectory !== (config.matchDataDirectory ?? "src/data") ||
      formState.matchDataFile !== (config.matchDataFile ?? "scouting-data.json")
    );
  }, [config, formState]);

  const handleChange = (key: keyof FormState) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormState((prev) => ({
      ...prev,
      [key]: event.target.value,
    }));
    setSaveSuccess(false);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      const response = await fetch("/api/config", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formState),
      });

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      const updated = await response.json();
      setConfig(updated);
      setSaveSuccess(true);
    } catch (error) {
      console.error("Failed to save configuration", error);
      setSaveError("Failed to save configuration. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleRefresh = async () => {
    setSaveError(null);
    setSaveSuccess(false);
    await refreshConfig();
  };

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Data & API Settings</h1>
          <p className="text-gray-400 mt-2">
            Manage your TBA API access and local scouting data defaults in one place.
          </p>
        </div>

        <Card className="bg-[#1A1A1A] border-gray-800">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-xl text-white">Configuration</CardTitle>
              <CardDescription className="text-gray-400">
                Values saved here are used across Match Analysis, Match Summary, and Targeted Planning.
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="ghost"
                className="text-gray-300 hover:text-white"
                onClick={handleRefresh}
                disabled={configLoading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${configLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300" htmlFor="tba-api-key">
                  TBA API Key
                </label>
                <Input
                  id="tba-api-key"
                  type="password"
                  value={formState.tbaApiKey}
                  onChange={handleChange("tbaApiKey")}
                  placeholder="Enter your The Blue Alliance API key"
                  className="bg-[#111111] border-gray-800 text-white placeholder-gray-500"
                  disabled={configLoading}
                  autoComplete="off"
                />
                <p className="text-sm text-gray-500">
                  This key is stored locally on the server and only used when proxying requests to TBA.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-300" htmlFor="event-code">
                    Event Code
                  </label>
                  <Input
                    id="event-code"
                    value={formState.eventCode}
                    onChange={handleChange("eventCode")}
                    placeholder="e.g., 2025micmp4"
                    className="bg-[#111111] border-gray-800 text-white placeholder-gray-500"
                    disabled={configLoading}
                  />
                  <p className="text-sm text-gray-500">
                    The TBA event key that should be used for match lookups.
                  </p>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-300" htmlFor="match-data-file">
                    Match Data File
                  </label>
                  <Input
                    id="match-data-file"
                    value={formState.matchDataFile}
                    onChange={handleChange("matchDataFile")}
                    placeholder="scouting-data.json"
                    className="bg-[#111111] border-gray-800 text-white placeholder-gray-500"
                    disabled={configLoading}
                  />
                  <p className="text-sm text-gray-500">
                    File name (JSON) within the directory below to use for scouting data.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300" htmlFor="match-data-directory">
                  Match Data Directory
                </label>
                <Input
                  id="match-data-directory"
                  value={formState.matchDataDirectory}
                  onChange={handleChange("matchDataDirectory")}
                  placeholder="src/data"
                  className="bg-[#111111] border-gray-800 text-white placeholder-gray-500"
                  disabled={configLoading}
                />
                <p className="text-sm text-gray-500">
                  Directory that contains your scouting data files.
                </p>
              </div>

              {(configError || saveError) && (
                <div className="flex items-center gap-2 rounded-md border border-red-500/40 bg-red-900/30 px-4 py-3 text-sm text-red-200">
                  <AlertCircle className="h-4 w-4" />
                  <span>{saveError || configError}</span>
                </div>
              )}

              {saveSuccess && !saveError && (
                <div className="rounded-md border border-emerald-500/40 bg-emerald-900/20 px-4 py-3 text-sm text-emerald-200">
                  Settings saved. Pages depending on TBA data will use the updated configuration automatically.
                </div>
              )}

              <div className="flex justify-end">
                <Button type="submit" disabled={saving || configLoading || !isDirty}>
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? "Saving..." : "Save Settings"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
