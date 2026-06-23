import { Route, Routes, useLocation } from "react-router-dom";
import Home from "./pages/Home";
import MyProjects from "./pages/MyProjects";
import Preview from "./pages/Preview";
import Pricing from "./pages/Pricing";
import Projects from "./pages/Projects";
import View from "./pages/View";
import Community from "./pages/Community";
import Navbar from "./components/Navbar";
import { Toaster } from "sonner";
import AuthPage from "./pages/auth/AuthPage";
import Settings from "./pages/Settings";
import Loading from "./pages/Loading";

const App = () => {
  const { pathname } = useLocation();
  const hideNavbar =
    (pathname.startsWith("/projects/") && pathname !== "/projects") ||
    pathname.startsWith("/view/") ||
    pathname.startsWith("/preview/");

  return (
    <div className="bg-black min-h-screen">
      <Toaster />
      {!hideNavbar && <Navbar />}
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/projects" element={<MyProjects />} />
          <Route path="/projects/:projectId" element={<Projects />} />
          <Route path="/preview/:projectId" element={<Preview />} />
          <Route path="/preview/:projectId/:versionId" element={<Preview />} />
          <Route path="/view/:projectId" element={<View />} />
          <Route path="/community" element={<Community />} />
          <Route path="/auth/:pathname" element={<AuthPage />} />
          <Route path="/account/settings" element={<Settings />} />
          <Route path="/loading" element={<Loading />} />
          <Route path="*" element={
            <div className="flex items-center justify-center h-screen text-white">
              <div className="text-center">
                <h1 className="text-6xl font-bold text-gray-600 mb-4">404</h1>
                <p className="text-gray-400 mb-6">Page not found</p>
                <a href="/" className="text-indigo-400 hover:text-indigo-300 underline">Go home</a>
              </div>
            </div>
          } />
        </Routes>
      </main>
    </div>
  );
};

export default App;
