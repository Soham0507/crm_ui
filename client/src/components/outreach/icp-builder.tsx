import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Brain, Target, Plus, X, Sparkles, Save, ChevronRight } from "lucide-react";
import type { ICPProfile, ICPConfig } from "@shared/schema";

interface ICPBuilderProps {
  onICPCreated: (icpId: number) => void;
  existingProfiles: ICPProfile[];
}

export default function ICPBuilder({ onICPCreated, existingProfiles }: ICPBuilderProps) {
  const [icpName, setIcpName] = useState("");
  const [aiPrompt, setAiPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<number | null>(null);
  
  // ICP Configuration State
  const [industries, setIndustries] = useState<string[]>([]);
  const [geoLocations, setGeoLocations] = useState<string[]>([]);
  const [companySizes, setCompanySizes] = useState<string[]>([]);
  const [techStack, setTechStack] = useState<string[]>([]);
  const [titles, setTitles] = useState<string[]>([]);
  const [seniority, setSeniority] = useState<string[]>([]);
  const [painPoints, setPainPoints] = useState<string[]>([]);
  const [triggers, setTriggers] = useState<string[]>([]);
  const [valueProps, setValueProps] = useState<string[]>([]);
  const [narrative, setNarrative] = useState("");
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Mutations
  const createICPMutation = useMutation({
    mutationFn: async (data: { name: string; config: ICPConfig; narrative: string }) => 
      apiRequest('POST', '/api/icp-profiles', data),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['/api/icp-profiles'] });
      toast({
        title: "ICP Profile Created",
        description: `Successfully created "${icpName}" profile`,
      });
      onICPCreated(result.id);
      resetForm();
    }
  });

  const generateWithAIMutation = useMutation({
    mutationFn: async (prompt: string) => 
      apiRequest('POST', '/api/icp-profiles/generate', { prompt }),
    onSuccess: (result) => {
      // Populate form with AI-generated data
      if (result.config) {
        const config = result.config as ICPConfig;
        setIndustries(config.company.industries || []);
        setGeoLocations(config.company.geo || []);
        setCompanySizes(config.company.size || []);
        setTechStack(config.company.tech || []);
        if (config.personas?.[0]) {
          setTitles(config.personas[0].title || []);
          setSeniority(config.personas[0].seniority || []);
        }
        setPainPoints(config.pain_points || []);
        setTriggers(config.triggers || []);
        setValueProps(config.value_props || []);
      }
      if (result.narrative) {
        setNarrative(result.narrative);
      }
      toast({
        title: "AI Generation Complete",
        description: "Review and adjust the generated ICP profile",
      });
    }
  });

  const handleAIGenerate = async () => {
    if (!aiPrompt.trim()) return;
    
    setIsGenerating(true);
    try {
      await generateWithAIMutation.mutateAsync(aiPrompt);
    } catch (error) {
      toast({
        title: "Generation Failed",
        description: "Unable to generate ICP with AI. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveICP = () => {
    if (!icpName.trim()) {
      toast({
        title: "Name Required",
        description: "Please provide a name for the ICP profile",
        variant: "destructive"
      });
      return;
    }

    const config: ICPConfig = {
      company: {
        industries,
        geo: geoLocations,
        size: companySizes,
        tech: techStack
      },
      personas: [{
        title: titles,
        seniority,
        functions: []
      }],
      pain_points: painPoints,
      triggers,
      value_props: valueProps,
      keywords: []
    };

    createICPMutation.mutate({
      name: icpName,
      config,
      narrative
    });
  };

  const resetForm = () => {
    setIcpName("");
    setAiPrompt("");
    setIndustries([]);
    setGeoLocations([]);
    setCompanySizes([]);
    setTechStack([]);
    setTitles([]);
    setSeniority([]);
    setPainPoints([]);
    setTriggers([]);
    setValueProps([]);
    setNarrative("");
    setSelectedProfile(null);
  };

  const loadExistingProfile = (profileId: number) => {
    const profile = existingProfiles.find(p => p.id === profileId);
    if (!profile) return;
    
    const config = profile.config as ICPConfig;
    setIcpName(profile.name);
    setIndustries(config.company?.industries || []);
    setGeoLocations(config.company?.geo || []);
    setCompanySizes(config.company?.size || []);
    setTechStack(config.company?.tech || []);
    if (config.personas?.[0]) {
      setTitles(config.personas[0].title || []);
      setSeniority(config.personas[0].seniority || []);
    }
    setPainPoints(config.pain_points || []);
    setTriggers(config.triggers || []);
    setValueProps(config.value_props || []);
    setNarrative(profile.narrative || "");
  };

  const addTag = (value: string, setter: (tags: string[]) => void, current: string[]) => {
    if (value && !current.includes(value)) {
      setter([...current, value]);
    }
  };

  const removeTag = (value: string, setter: (tags: string[]) => void, current: string[]) => {
    setter(current.filter(t => t !== value));
  };

  return (
    <div className="grid grid-cols-3 gap-6">
      {/* AI Assistant Sidebar */}
      <div className="col-span-1">
        <Card className="sticky top-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-requisor-turquoise" />
              AI ICP Assistant
            </CardTitle>
            <CardDescription>
              Describe your ideal customer and I'll help build the profile
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Describe Your Ideal Customer</Label>
              <Textarea
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="E.g., We sell payment reconciliation software to fintech companies with 50-200 employees that use Stripe..."
                className="mt-2 min-h-[120px]"
              />
            </div>
            
            <Button 
              onClick={handleAIGenerate}
              disabled={isGenerating || !aiPrompt.trim()}
              className="w-full bg-requisor-turquoise hover:bg-requisor-turquoise/90"
            >
              {isGenerating ? (
                <>Generating...</>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate with AI
                </>
              )}
            </Button>

            {existingProfiles.length > 0 && (
              <div className="pt-4 border-t">
                <Label>Or Load Existing Profile</Label>
                <Select value={selectedProfile?.toString()} onValueChange={(v) => {
                  const id = parseInt(v);
                  setSelectedProfile(id);
                  loadExistingProfile(id);
                }}>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Select a profile..." />
                  </SelectTrigger>
                  <SelectContent>
                    {existingProfiles.map(profile => (
                      <SelectItem key={profile.id} value={profile.id.toString()}>
                        {profile.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="pt-4 border-t text-sm text-gray-500">
              <p className="font-medium mb-2">Tips for better results:</p>
              <ul className="space-y-1 text-xs">
                <li>• Include your product/service</li>
                <li>• Mention specific pain points</li>
                <li>• Describe company characteristics</li>
                <li>• Note decision maker roles</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ICP Form Builder */}
      <div className="col-span-2 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              ICP Profile Builder
            </CardTitle>
            <CardDescription>
              Define your ideal customer profile with specific criteria
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Profile Name */}
            <div>
              <Label htmlFor="icp-name">Profile Name *</Label>
              <Input
                id="icp-name"
                value={icpName}
                onChange={(e) => setIcpName(e.target.value)}
                placeholder="e.g., Fintech Series A Companies"
                className="mt-2"
              />
            </div>

            {/* Company Criteria */}
            <div className="space-y-4">
              <h3 className="font-medium">Company Criteria</h3>
              
              {/* Industries */}
              <div>
                <Label>Industries</Label>
                <div className="mt-2 space-y-2">
                  <Input
                    placeholder="Add industry (press Enter)"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        const input = e.currentTarget;
                        addTag(input.value, setIndustries, industries);
                        input.value = '';
                      }
                    }}
                  />
                  <div className="flex flex-wrap gap-2">
                    {industries.map(ind => (
                      <Badge key={ind} variant="secondary">
                        {ind}
                        <button onClick={() => removeTag(ind, setIndustries, industries)}>
                          <X className="h-3 w-3 ml-1" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              {/* Geo Locations */}
              <div>
                <Label>Locations</Label>
                <div className="mt-2 space-y-2">
                  <Input
                    placeholder="Add location (press Enter)"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        const input = e.currentTarget;
                        addTag(input.value, setGeoLocations, geoLocations);
                        input.value = '';
                      }
                    }}
                  />
                  <div className="flex flex-wrap gap-2">
                    {geoLocations.map(geo => (
                      <Badge key={geo} variant="secondary">
                        {geo}
                        <button onClick={() => removeTag(geo, setGeoLocations, geoLocations)}>
                          <X className="h-3 w-3 ml-1" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              {/* Company Size */}
              <div>
                <Label>Company Size</Label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {['1-10', '11-50', '51-200', '201-500', '500+'].map(size => (
                    <Badge
                      key={size}
                      variant={companySizes.includes(size) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => {
                        if (companySizes.includes(size)) {
                          setCompanySizes(companySizes.filter(s => s !== size));
                        } else {
                          setCompanySizes([...companySizes, size]);
                        }
                      }}
                    >
                      {size} employees
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            {/* Personas */}
            <div className="space-y-4">
              <h3 className="font-medium">Target Personas</h3>
              
              {/* Job Titles */}
              <div>
                <Label>Job Titles</Label>
                <div className="mt-2 space-y-2">
                  <Input
                    placeholder="Add job title (press Enter)"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        const input = e.currentTarget;
                        addTag(input.value, setTitles, titles);
                        input.value = '';
                      }
                    }}
                  />
                  <div className="flex flex-wrap gap-2">
                    {titles.map(title => (
                      <Badge key={title} variant="secondary">
                        {title}
                        <button onClick={() => removeTag(title, setTitles, titles)}>
                          <X className="h-3 w-3 ml-1" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              {/* Seniority */}
              <div>
                <Label>Seniority Level</Label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {['C-Level', 'VP', 'Director', 'Manager', 'Individual'].map(level => (
                    <Badge
                      key={level}
                      variant={seniority.includes(level) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => {
                        if (seniority.includes(level)) {
                          setSeniority(seniority.filter(s => s !== level));
                        } else {
                          setSeniority([...seniority, level]);
                        }
                      }}
                    >
                      {level}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            {/* Pain Points & Value Props */}
            <div className="space-y-4">
              <h3 className="font-medium">Pain Points & Value Propositions</h3>
              
              {/* Pain Points */}
              <div>
                <Label>Pain Points</Label>
                <div className="mt-2 space-y-2">
                  <Input
                    placeholder="Add pain point (press Enter)"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        const input = e.currentTarget;
                        addTag(input.value, setPainPoints, painPoints);
                        input.value = '';
                      }
                    }}
                  />
                  <div className="flex flex-wrap gap-2">
                    {painPoints.map(pain => (
                      <Badge key={pain} variant="secondary" className="bg-red-50">
                        {pain}
                        <button onClick={() => removeTag(pain, setPainPoints, painPoints)}>
                          <X className="h-3 w-3 ml-1" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              {/* Value Props */}
              <div>
                <Label>Value Propositions</Label>
                <div className="mt-2 space-y-2">
                  <Input
                    placeholder="Add value proposition (press Enter)"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        const input = e.currentTarget;
                        addTag(input.value, setValueProps, valueProps);
                        input.value = '';
                      }
                    }}
                  />
                  <div className="flex flex-wrap gap-2">
                    {valueProps.map(prop => (
                      <Badge key={prop} variant="secondary" className="bg-green-50">
                        {prop}
                        <button onClick={() => removeTag(prop, setValueProps, valueProps)}>
                          <X className="h-3 w-3 ml-1" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Narrative */}
            <div>
              <Label>ICP Narrative</Label>
              <Textarea
                value={narrative}
                onChange={(e) => setNarrative(e.target.value)}
                placeholder="Describe the ideal customer profile story..."
                className="mt-2 min-h-[100px]"
              />
            </div>

            {/* Actions */}
            <div className="flex justify-between items-center pt-4 border-t">
              <Button variant="outline" onClick={resetForm}>
                Clear Form
              </Button>
              <div className="flex gap-2">
                <Button
                  onClick={handleSaveICP}
                  disabled={!icpName.trim() || createICPMutation.isPending}
                  className="bg-requisor-turquoise hover:bg-requisor-turquoise/90"
                >
                  {createICPMutation.isPending ? 'Saving...' : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save ICP Profile
                    </>
                  )}
                </Button>
                <Button
                  onClick={() => {
                    handleSaveICP();
                  }}
                  disabled={!icpName.trim() || createICPMutation.isPending}
                  variant="default"
                >
                  Save & Find Leads
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}