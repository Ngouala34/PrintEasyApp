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
