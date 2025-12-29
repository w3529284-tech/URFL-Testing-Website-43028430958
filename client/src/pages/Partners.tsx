import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import type { Partner } from "@shared/schema";

export default function Partners() {
  const { data: partners = [] } = useQuery<Partner[]>({
    queryKey: ["/api/partners"],
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl md:text-5xl font-black mb-4" data-testid="text-page-title">
          Our Partners
        </h1>
        <p className="text-muted-foreground text-lg">Supporting the URFL</p>
      </div>

      {partners.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {partners.map((partner) => (
            <Card key={partner.id} className="p-6 space-y-4 hover:shadow-lg transition-shadow">
              {partner.imageUrl && (
                <img 
                  src={partner.imageUrl} 
                  alt={partner.name}
                  className="w-full h-48 object-cover rounded-md"
                />
              )}
              <div>
                <h2 className="text-2xl font-bold">{partner.name}</h2>
              </div>
              <p className="text-muted-foreground italic">"{partner.quote}"</p>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">No partners yet.</p>
        </Card>
      )}
    </div>
  );
}
