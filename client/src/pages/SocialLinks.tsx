import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Link2, Youtube, MessageSquare } from "lucide-react";
import { SiDiscord } from "react-icons/si";

interface SocialLink {
  title: string;
  description: string;
  icon: React.ReactNode;
  url: string;
  color: string;
}

export default function SocialLinks() {
  const socialLinks: SocialLink[] = [
    {
      title: "Discord",
      description: "Join the Discord server",
      icon: <SiDiscord className="w-8 h-8" />,
      url: "https://discord.gg/xTt9BrCaZF",
      color: "hover:text-indigo-500",
    },
    {
      title: "YouTube",
      description: "Subscribe to my YouTube channel",
      icon: <Youtube className="w-8 h-8" />,
      url: "https://www.youtube.com/channel/UC6SHPaaTEucLm6F9PDBjm7Q",
      color: "hover:text-red-600",
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-12">
        <h1 className="text-4xl md:text-5xl font-black mb-4" data-testid="text-page-title">
          Connect With Us
        </h1>
        <p className="text-muted-foreground text-lg">Follow URFL on social media and stay updated with the latest news, updates, and announcements</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        {socialLinks.map((link) => (
          <Card
            key={link.title}
            className="p-8 flex flex-col items-center text-center hover-elevate cursor-pointer"
            onClick={() => window.open(link.url, "_blank")}
            data-testid={`card-social-${link.title.toLowerCase()}`}
          >
            <div className={`mb-4 transition-colors ${link.color}`}>
              {link.icon}
            </div>
            <h3 className="text-xl font-bold mb-2" data-testid={`text-${link.title.toLowerCase()}`}>
              {link.title}
            </h3>
            <p className="text-sm text-muted-foreground mb-6 flex-1">
              {link.description}
            </p>
            <Button variant="outline" size="sm" className="gap-2" data-testid={`button-visit-${link.title.toLowerCase()}`}>
              <Link2 className="w-4 h-4" />
              Visit
            </Button>
          </Card>
        ))}
      </div>
      <div className="mt-16 mb-12">
        <h2 className="text-3xl font-bold mb-8" data-testid="text-feedback-title">
          Send Feedback
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card
            className="p-8 flex flex-col items-center text-center hover-elevate cursor-pointer"
            onClick={() => window.open("https://docs.google.com/forms/d/e/1FAIpQLSeACYEIlsdu900cuQY8REcZXPgI01XQdVJDDR3d-g3r96GO9Q/viewform?usp=dialog", "_blank")}
            data-testid="card-feedback"
          >
            <div className="mb-4 transition-colors hover:text-blue-500">
              <MessageSquare className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold mb-2" data-testid="text-feedback">
              Share Your Feedback
            </h3>
            <p className="text-sm text-muted-foreground mb-6 flex-1">
              Help us improve! Let us know what you think about the website and report any issues you encounter, or suggestions you have.
            </p>
            <Button variant="outline" size="sm" className="gap-2" data-testid="button-feedback">
              <Link2 className="w-4 h-4" />
              Open Form
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
}
