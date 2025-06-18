import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Users, 
  TrendingUp, 
  GitBranch, 
  BarChart3, 
  Zap, 
  Shield, 
  Cloud,
  CheckCircle,
  ArrowRight,
  Star,
  Building,
  Mail,
  Phone
} from "lucide-react";

export default function Landing() {
  const features = [
    {
      icon: <Users className="h-6 w-6" />,
      title: "Contact Management",
      description: "Organize all your contacts with detailed profiles, notes, and activity tracking."
    },
    {
      icon: <GitBranch className="h-6 w-6" />,
      title: "Visual Pipeline",
      description: "Track deals through your sales process with drag-and-drop pipeline boards."
    },
    {
      icon: <BarChart3 className="h-6 w-6" />,
      title: "Smart Analytics",
      description: "Get insights into your sales performance with real-time dashboard metrics."
    },
    {
      icon: <Zap className="h-6 w-6" />,
      title: "Lightning Fast",
      description: "Built with modern technology for instant loading and smooth interactions."
    },
    {
      icon: <Shield className="h-6 w-6" />,
      title: "Secure & Private",
      description: "Your data is protected with enterprise-grade security and authentication."
    },
    {
      icon: <Cloud className="h-6 w-6" />,
      title: "Cloud-Based",
      description: "Access your CRM from anywhere with automatic syncing and backups."
    }
  ];

  const benefits = [
    "Increase sales productivity by 40%",
    "Never lose track of important leads",
    "Collaborate with your team seamlessly",
    "Get actionable insights from your data",
    "Scale your business with confidence"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
              <h1 className="ml-3 text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                CRM Pro
              </h1>
            </div>
            <Button 
              onClick={() => window.location.href = '/api/login'}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              Sign In
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-20 pb-32 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <Badge className="mb-6 bg-blue-100 text-blue-800 border-blue-200">
            ✨ Modern CRM Platform
          </Badge>
          
          <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6 leading-tight">
            Supercharge Your
            <br />
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Sales Pipeline
            </span>
          </h1>
          
          <p className="text-xl text-gray-600 mb-10 max-w-3xl mx-auto leading-relaxed">
            The only CRM you'll ever need. Combine the power of Airtable's data organization 
            with Pipedrive's visual sales tracking in one beautiful, modern platform.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
            <Button 
              size="lg"
              onClick={() => window.location.href = '/api/login'}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-lg px-8 py-6"
            >
              Get Started Free
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <div className="flex items-center text-sm text-gray-500">
              <Star className="h-4 w-4 text-yellow-500 mr-1" />
              <span>No credit card required</span>
            </div>
          </div>

          {/* Hero Image/Demo */}
          <div className="relative">
            <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 p-6 max-w-5xl mx-auto">
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-8">
                <div className="grid grid-cols-4 gap-4 mb-6">
                  <div className="bg-blue-100 rounded-lg p-4 text-center">
                    <TrendingUp className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-blue-600">127</div>
                    <div className="text-sm text-gray-600">Active Deals</div>
                  </div>
                  <div className="bg-green-100 rounded-lg p-4 text-center">
                    <Users className="h-8 w-8 text-green-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-green-600">2,341</div>
                    <div className="text-sm text-gray-600">Contacts</div>
                  </div>
                  <div className="bg-purple-100 rounded-lg p-4 text-center">
                    <BarChart3 className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-purple-600">$847K</div>
                    <div className="text-sm text-gray-600">Pipeline Value</div>
                  </div>
                  <div className="bg-orange-100 rounded-lg p-4 text-center">
                    <CheckCircle className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-orange-600">34%</div>
                    <div className="text-sm text-gray-600">Win Rate</div>
                  </div>
                </div>
                <div className="text-center text-gray-500 text-sm">
                  Real-time dashboard preview
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Everything you need to close more deals
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Built for modern sales teams who want simplicity without sacrificing power.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <CardHeader>
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center text-white mb-4">
                    {feature.icon}
                  </div>
                  <CardTitle className="text-xl font-semibold">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-24 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold text-white mb-6">
                Join thousands of successful sales teams
              </h2>
              <p className="text-xl text-blue-100 mb-8">
                Companies using CRM Pro see immediate improvements in their sales process 
                and team productivity.
              </p>
              <ul className="space-y-4">
                {benefits.map((benefit, index) => (
                  <li key={index} className="flex items-center text-white">
                    <CheckCircle className="h-6 w-6 text-green-400 mr-3 flex-shrink-0" />
                    <span className="text-lg">{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20">
              <div className="text-center mb-6">
                <div className="text-5xl font-bold text-white mb-2">94%</div>
                <div className="text-blue-100">Customer Satisfaction</div>
              </div>
              <div className="grid grid-cols-2 gap-6 text-center">
                <div>
                  <div className="text-3xl font-bold text-white">50K+</div>
                  <div className="text-blue-100 text-sm">Active Users</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-white">99.9%</div>
                  <div className="text-blue-100 text-sm">Uptime</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-white">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-gray-900 mb-6">
            Ready to transform your sales process?
          </h2>
          <p className="text-xl text-gray-600 mb-10">
            Start your free trial today. No setup fees, no contracts, no risk.
          </p>
          <Button 
            size="lg"
            onClick={() => window.location.href = '/api/login'}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-lg px-12 py-6"
          >
            Start Free Trial
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
          <p className="text-sm text-gray-500 mt-4">
            Free 14-day trial • No credit card required • Cancel anytime
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center mb-4 md:mb-0">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
              <span className="ml-3 text-xl font-bold text-white">CRM Pro</span>
            </div>
            <div className="flex items-center space-x-6 text-gray-400">
              <div className="flex items-center">
                <Building className="h-4 w-4 mr-2" />
                <span>Enterprise Ready</span>
              </div>
              <div className="flex items-center">
                <Shield className="h-4 w-4 mr-2" />
                <span>SOC 2 Compliant</span>
              </div>
              <div className="flex items-center">
                <Cloud className="h-4 w-4 mr-2" />
                <span>99.9% Uptime</span>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2025 CRM Pro. Built with modern technology for modern sales teams.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}