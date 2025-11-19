import { getDefaultStore } from 'jotai';
import { documentsAtom, polarisDocumentsAtom, syncToPolarisAtom } from '@/src/hooks/atoms';
import { DocumentService } from '@/src/services/document/DocumentService';
import { Document } from '@/src/types/core';
import LogService from '@/utils/LogService';
import { toastService } from '@/src/services/toastService';

/**
 * Actions for managing documents that avoid circular dependencies
 */

export const documentActions = {
  /**
   * Delete documents that are no longer in the provided list
   */
  async deleteRemovedDocuments(newDocuments: Document[]): Promise<void> {
    try {
      const store = getDefaultStore();
      const syncToPolaris = await store.get(syncToPolarisAtom);
      
      if (syncToPolaris) {
        // Get current documents to compare for deletions
        const existingDocuments = await store.get(polarisDocumentsAtom);
        
        // Find documents that exist in existingDocuments but not in the new documents array
        const documentsToDelete = existingDocuments.filter(
          (existing) => !newDocuments.some((newDoc) => newDoc.id === existing.id),
        );

        // Delete removed documents
        for (const document of documentsToDelete) {
          try {
            await DocumentService.deleteDocument(document.id);
          } catch (error: any) {
            LogService.log(
              error,
              { component: "documentActions", function: "deleteRemovedDocuments" },
              "error",
            );
            toastService.danger({
              title: "Error",
              description: `Failed to delete document: ${document.name}`,
            });
          }
        }
      }
    } catch (error: any) {
      LogService.log(
        error,
        { component: "documentActions", function: "deleteRemovedDocuments" },
        "error",
      );
    }
  },

  /**
   * Update documents with proper deletion handling
   */
  async updateDocuments(newDocuments: Document[]): Promise<void> {
    const store = getDefaultStore();
    
    // First handle deletions
    await this.deleteRemovedDocuments(newDocuments);
    
    // Then update the documents atom
    await store.set(documentsAtom, newDocuments);
  }
};