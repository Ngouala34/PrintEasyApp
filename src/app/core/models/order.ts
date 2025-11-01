export interface IOrderData {
  type_document: string;                    
  format: 'A0'|'A1'|'A2'|'A3' | 'A4' | 'autre';    
  cote: 'recto_verso' | 'recto_simple';     
  couleur: 'noir_et_blanc' | 'couleur';
  support_impression: string;                
  quantite: number;
  description?: string;
  livraison: 'non' | 'oui';
  prix_total: number;
  prix_unitaire: number;
  reduction: number;
  delais: Date;
  files:{
        file: File;
        name: string;
        size: string;
        document_number:number
    }; 
  format_client?: {
        lengueur: number;   // en cm
        largeur: number;    // en cm
    } ;
  address_livraison?:{
        ville: string;
        quartier: string;
        address: string;
        telephone: string;
    };
}


export interface IPrintOrder {
  note?: string | null;                    // Optionnel
  quantity?: number;                       // Défaut: 1
  number_of_pages?: number;                // Défaut: 1
  document_type_name: string;              // Obligatoire (minLength: 1)
  option_format?: string | null;           // Optionnel
  option_color?: string | null;            // Optionnel
  option_paper?: string | null;            // Optionnel
  option_sides?: string | null;            // Optionnel
  option_delivery?: string | null;         // Optionnel
  option_finish?: string | null;           // Optionnel
  option_binding?: string | null;          // Optionnel
  delivery_city?: string | null;           // Optionnel (maxLength: 100)
  delivery_neighborhood?: string | null;   // Optionnel (maxLength: 150)
  delivery_address?: string | null;        // Optionnel (maxLength: 300)
  delivery_phone?: string | null;          // Optionnel (maxLength: 30)
}
