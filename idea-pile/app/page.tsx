import { PenTool, FileText, Users, Lightbulb } from 'lucide-react';
import WhiteboardPage from './whiteboard-page';


export default function LandingPage() {
  const features = [
    {
      icon: Users,
      title: 'Team Collaboration',
      description: 'Work together seamlessly with your team members in shared workspaces and projects.'
    }
  ];
  return <WhiteboardPage />;
/*
  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="px-6 py-4 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Lightbulb className="w-4 h-4 text-white" />
              </div>
              <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-purple-500 rounded-full"></div>
              <div className="absolute -bottom-0.5 -left-0.5 w-1.5 h-1.5 bg-green-500 rounded-full"></div>
            </div>
            <span className="text-xl font-bold text-slate-800">Idea Pile</span>
          </div>

          <div className="flex items-center space-x-4">
            <button className="px-4 py-2 text-slate-600 hover:text-slate-800 font-medium transition-colors duration-200 text-sm md:text-base md:px-6">
              Login
            </button>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors duration-200 text-sm md:text-base md:px-6">
              Register
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-16 md:py-24">
        <div className="text-center">
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-slate-800 mb-6 leading-tight">
            Where Ideas
            <span className="block text-blue-600">Come to Life</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-600 mb-12 max-w-2xl mx-auto leading-relaxed">
            Capture your thoughts, sketch your concepts, and collaborate with others in a seamless creative workspace designed for modern teams.
          </p>

          <div className="grid md:grid-cols-2 gap-8 mb-16">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 hover:shadow-lg transition-shadow duration-200"
              >
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <feature.icon className="w-5 h-5 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-800 mb-3">
                  {feature.title}
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>

          <div className="space-y-4">
            <button className="px-8 py-3 bg-blue-600 text-white text-base font-semibold rounded-lg hover:bg-blue-700 transition-colors duration-200 shadow-lg">
              Start Creating Today
            </button>
            <p className="text-xs text-slate-500">
              Free to start • No credit card required
            </p>
          </div>
        </div>
      </main>
*
      <footer className="bg-white border-t border-slate-200 py-8 mt-16">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="w-6 h-6 bg-blue-600 rounded-lg flex items-center justify-center">
              <Lightbulb className="w-3 h-3 text-white" />
            </div>
            <span className="text-base font-semibold text-slate-800">Idea Pile</span>
          </div>
          <p className="text-slate-500 text-xs">
            © 2025 Idea Pile. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );*/
}