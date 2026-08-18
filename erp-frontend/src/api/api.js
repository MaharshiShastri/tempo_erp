
const API = {
  headers: (token) => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  }),

  async login(email, password) {
    const response = await fetch("/api/v1/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      throw new Error("Authentication parameters rejected.");
    }

    return response.json();
  },

  async fetchOrders(token) {
    const r = await fetch("/api/v1/orders", {
      headers: this.headers(token),
    });

    return r.json();
  },

  async saveOrder(payload, token) {
    const r = await fetch("/api/v1/orders/create", {
      method: "POST",
      headers: this.headers(token),
      body: JSON.stringify(payload),
    });

    if (!r.ok) {
      const err = await r.json();
      throw new Error(err.detail || "Order tracking failure.");
    }

    return r.json();
  },

  async fetchBills(token) {
    const r = await fetch("/api/v1/bills", {
      headers: this.headers(token),
    });

    return r.json();
  },

  async saveBill(payload, token) {
    const r = await fetch("/api/v1/bills/create", {
      method: "POST",
      headers: this.headers(token),
      body: JSON.stringify(payload),
    });

    if (!r.ok) {
      const err = await r.json();
      throw new Error(err.detail);
    }

    return r.json();
  },

  async fetchCompaniesMaster(token) {
    const r = await fetch("/api/v1/companies/get", {
      headers: this.headers(token),
    });

    return r.json();
  },
  async fetchCompany(companyId, token){
    
    const r = await fetch(`/api/v1/companies/get/${companyId}`,{
      headers: this.headers(token),
    });
    if (!r.ok){
      const err = await r.json();
      throw new Error(err.detail);
    }
    return r.json();
  },

  async saveCompanyMaster(payload, token) {
    const r = await fetch("/api/v1/companies/create", {
      method: "POST",
      headers: this.headers(token),
      body: JSON.stringify(payload),
    });

    if (!r.ok) {
      const err = await r.json();
      throw new Error(err.detail);
    }

    return r.json();
  },
  
  async updateCompany(companyId, payload, token){
    const r = await fetch(`/api/v1/companies/update/${companyId}`, {
      method: "PUT",
      headers: this.headers(token),
      body: JSON.stringify(payload),
    });

    if (!r.ok){
      const err = await r.json();
      throw new Error(err.detail);
    }
    return r.json();
  },

  async deleteCompany(companyId, token){
    const r = await fetch(`/api/v1/companies/delete/${companyId}`,{
      method: "DELETE",
      headers: this.headers(token),
    });

    if(!r.ok){
      const err = await r.json();
      throw new Error(err.detail);
    }

    return r.json();
  },
  async searchCompanies(query, token){
    const r = await fetch(`/api/v1/companies/search?q=${encodeURIComponent(query)}`, {
      headers: this.headers(token),
    });

    if(!r.ok){
      throw new Error(err.detail);
    }
    return r.json();
  },
  async fetchTasks(token) {
    const r = await fetch("/api/v1/tasks", {
      headers: this.headers(token),
    });

    if (!r.ok) {
      throw new Error("Failed to download tasks.");
    }

    return r.json();
  },
  // Add this inside the API object in api.js
  async fetchTaskAttachment(fileName, token) {
    // Extract base name in case a full path was passed
    const baseName = fileName.split(/[\\/]/).pop(); 
    const r = await fetch(`/api/v1/tasks/attachment/${encodeURIComponent(baseName)}`, {
        headers: { "Authorization": `Bearer ${token}` }
    });

    if (!r.ok) {
        const err = await r.json().catch(() => ({ detail: "File fetch failed" }));
        throw new Error(err.detail || "File not found or unauthorized");
    }
    
    return r.blob(); // Crucial: Return as Blob, not JSON!
  },
  saveDispatchRecord: async (payload, token) => {
    const res = await fetch("/api/v1/dispatch/records/save", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload)
    });

    if (!res.ok) {
        // Parse the error payload to get the exact backend exception message
        const err = await res.json();
        throw new Error(err.detail || "Failed to save dispatch record.");
    }
    
    return res.json();
  },
  
  async saveTask(payload, token) {
    const formData = new FormData();

    formData.append("title", payload.title);
    formData.append("details", payload.details);
    formData.append("direction", payload.direction || "dispatched");

    payload.assigned_to.forEach(email => {
        formData.append("assigned_to", email);
    });

    if (payload.deadline) {
        formData.append("deadline", payload.deadline);
    }

    if (payload.attachments?.length) {
      payload.attachments.forEach(file=>{
        formData.append("attachments", file);
      });
    }

    const r = await fetch("/api/v1/tasks/create", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${token}`
        },
        body: formData
    });

    return r.json();
  },

  async toggleTaskStatus(taskId, token) {
    const r = await fetch(`/api/v1/tasks/${taskId}/toggle`, {
      method: "POST",
      headers: this.headers(token),
    });

    return r.json();
  },
  
  getPartnerProfile: async (partnerId, token) => {
      const res = await fetch(`/api/v1/dispatch/partners/${partnerId}/profile`, {
          headers: { "Authorization": `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to fetch full profile");
      return res.json();
  },

  evaluateDispatch: async (payload, token) => {
    const res = await fetch("/api/v1/dispatch/evaluate", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload)
    });

    if (!res.ok) throw new Error("Dispatch evaluation failed");
    return res.json();
  },
  
  updateDispatchPartner: async (partnerId, payload, token) => {
      const res = await fetch(`/api/v1/dispatch/partners/${partnerId}`, {
          method: "PUT",
          headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error("Failed to update partner data");
      return res.json();
  },

  getPartners: async (token) => {
      const res = await fetch("/api/v1/dispatch/partners", {
          headers: {
              "Authorization": `Bearer ${token}`
          }
      });

      if (!res.ok) throw new Error("Failed to fetch partners");
      return res.json();
  },
  
  patchDispatchPartner: async (partnerId, payload, token ) => {
      const res = await fetch(`/api/v1/dispatch/partners/${partnerId}`, {
              method: "PATCH",
              headers: {
                  "Content-Type":"application/json",
                  "Authorization":`Bearer ${token}`
              },
              body: JSON.stringify(payload)
          }
      );

      if(!res.ok)
          throw new Error("Patch failed");

      return res.json();
  },
  
  saveDispatchPartner: async (payload, token) => {
      const res = await fetch("/api/v1/dispatch/partners/save", {
          method: "POST",
          headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error("Failed to save partner");
      return res.json();
  },

  async saveItemMaster(payload, token) {
    const r = await fetch('/api/v1/master/items/create', {method: 'POST',headers: this.headers(token),body: JSON.stringify(payload)});
    if (!r.ok) { const err = await r.json(); throw new Error(err.detail || 'Failed to populate item profile.'); }
    return await r.json();
  },
  updateDispatchPartner: async (partnerId, payload, token) => {
    const res = await fetch(`/api/v1/dispatch/partners/${partnerId}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload)
    });

    if (!res.ok) throw new Error("Failed to update partner");
    return res.json();
  },

  async updateItemMaster(itemCode, payload, token) {
    const r = await fetch(`/api/v1/master/items/${itemCode}`,{
            method: "PUT",
            headers: this.headers(token),
            body: JSON.stringify(payload)
        }
    );

    if (!r.ok) {
        const err = await r.json();
        throw new Error(err.detail);
    }

    return r.json();
  },
  async fetchItemMaster(token){
    const r = await fetch('/api/v1/master/items', {
      headers: this.headers(token)
    });
    if (!r.ok){
      const err = await r.json();
      throw new Error(err.detail);
    }
    return r.json();
  },
  async deleteItemMaster(itemCode, token) {
    const r = await fetch(
        `/api/v1/master/items/${itemCode}`,
        {
            method: "DELETE",
            headers: this.headers(token)
        }
    );

    if (!r.ok) {
        const err = await r.json();
        throw new Error(err.detail);
    }

    return r.json();
  },
  async fetchActivityTree(token){
    const r = await fetch("/api/v1/dashboard/activity-tree", {headers: this.headers(token)});
    if(!r.ok) throw new Error("Failed to load activity tree")
    return await r.json();
  },
  
  async fetchLeads(token) {
    const r = await fetch("/api/v1/crm/leads", {
      headers: this.headers(token),
    });
    if (!r.ok) throw new Error("Failed to download CRM pipeline.");
    return r.json();
  },

  async updateLeadStatus(leadId, status, token) {
    const r = await fetch(`/api/v1/crm/leads/${leadId}/status`, {
      method: "PATCH",
      headers: this.headers(token),
      body: JSON.stringify({ status }),
    });
    if (!r.ok) throw new Error("Failed to update lead status.");
    return r.json();
  },
  
  async fetchUsers(token) {
    const r = await fetch("/api/v1/auth/users", { headers: this.headers(token) });
    if (!r.ok) throw new Error("Failed to fetch users directory.");
    return r.json();
  },

  async updateUser(email, payload, token) {
    const r = await fetch(`/api/v1/auth/users/${email}`, {
        method: "PUT",
        headers: this.headers(token),
        body: JSON.stringify(payload)
    });
    if (!r.ok) throw new Error("Failed to update user profile.");
    return r.json();
  },

  async deleteUser(email, token) {
    const r = await fetch(`/api/v1/auth/users/${email}`, {
        method: "DELETE",
        headers: this.headers(token)
    });
    if (!r.ok) {
        const err = await r.json();
        throw new Error(err.detail || "Failed to delete user.");
    }
    return r.json();
  },
  
  async scanVendorBill(file, token) {
    const formData = new FormData();
    formData.append("file", file);

    const r = await fetch("/api/v1/wms/grn/scan-bill", {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` }, // Fetch handles multipart boundaries automatically
        body: formData
    });
    if (!r.ok) {
        const err = await r.json();
        throw new Error(err.detail || "Failed to scan bill.");
    }
    return r.json();
  },
  
  async exportGRNPreview(payload, token) {

    const r = await fetch(
          "/api/v1/wms/grn/export-preview",
          {
              method: "POST",
              headers: {
                  Authorization: `Bearer ${token}`,
                  "Content-Type": "application/json"
              },
              body: JSON.stringify(payload)
          }
      );

      if (!r.ok)
          throw new Error("Export failed");

      return r.blob();
  },
  async saveGRN(payload, token) {

      const r = await fetch(
          "/api/v1/wms/grn/save",
          {
              method: "POST",
              headers: this.headers(token),
              body: JSON.stringify(payload)
          }
      );

      if (!r.ok) {
          const err = await r.json();
          throw new Error(err.detail || "Failed to save GRN");
      }

      return r.json();
  },
  async uploadItemMasterCSV(file, token) {
    const formData = new FormData();
    formData.append("file", file);

    const r = await fetch("/api/v1/wms/items/seed-test-csv", {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` }, // Do NOT set Content-Type
        body: formData
    });
    
    if (!r.ok) {
        const err = await r.json();
        throw new Error(err.detail || "Failed to upload CSV.");
    }
    return r.json();
  },

  async getTestItem(itemCode, token) {

      const r = await fetch(
          `/api/v1/wms/test-item/${encodeURIComponent(itemCode)}`,
          {
              headers: {
                  Authorization: `Bearer ${token}`
              }
          }
      );

      if (!r.ok) {
          throw new Error("Lookup failed");
      }

      return r.json();
  },
  // Add this inside the API object in api.js
  async syncTallyData(payload, token) {
    const r = await fetch("/api/v1/tally/preview", {
        method: "POST",
        headers: {"Content-Type": "application/json","Authorization": `Bearer ${token}`},
        body: JSON.stringify(payload),
    });

    if (!r.ok) {
        const err = await r.json();
        throw new Error(err.detail || "Tally proxy synchronization failed.");
    }
    
    return r.json();
  },
  // --- LEAD ENGINE API ---
  async submitLeadTarget(payload, token) {
    const r = await fetch("/api/v1/lead-engine/target", {
      method: "POST",
      headers: this.headers(token),
      body: JSON.stringify(payload),
    });
    if (!r.ok) {
        const err = await r.json();
        throw new Error(err.detail || "Failed to submit target.");
    }
    return r.json();
  },

  async fetchLeadTargets(token) {
    const r = await fetch("/api/v1/lead-engine/targets", { headers: this.headers(token) });
    if (!r.ok) throw new Error("Failed to fetch targets.");
    return r.json();
  },

  async fetchLeadContacts(targetId, token) {
    const r = await fetch(`/api/v1/lead-engine/targets/${targetId}/contacts`, { headers: this.headers(token) });
    if (!r.ok) throw new Error("Failed to fetch contacts.");
    return r.json();
  },

  async simulateOvernightSync(targetId, token) {
    const r = await fetch(`/api/v1/lead-engine/targets/${targetId}/simulate-sync`, {
      method: "POST",
      headers: this.headers(token)
    });
    if (!r.ok) throw new Error("Simulation failed.");
    return r.json();
  },
  async uploadLeadTargets(formData, token){

    const r = await fetch(
        "/api/v1/lead-engine/upload",
        {
            method:"POST",
            headers:{
                Authorization:`Bearer ${token}`
            },
            body:formData
        }
    );

    if(!r.ok){

        const err = await r.json();

        throw new Error(err.detail);

    }

    return r.json();

  },
  async bulkUploadLeadTargets(formData, token) {
    const r = await fetch("/api/v1/lead-engine/bulk-targets", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${token}`
        },
        body: formData,
    });

    if (!r.ok) {
        const err = await r.json();
        throw new Error(err.detail || "Bulk upload failed.");
    }

    return r.json();
  },
  async updateLeadTarget(targetId, payload, token) {
    const r = await fetch(`/api/v1/lead-engine/targets/${targetId}`, {
        method: "PUT",
        headers: this.headers(token),
        body: JSON.stringify(payload),
    });
    if (!r.ok) { const err = await r.json(); throw new Error(err.detail); }
    return r.json();
  },

  async deleteLeadTarget(targetId, token) {
    const r = await fetch(`/api/v1/lead-engine/targets/${targetId}`, {
        method: "DELETE",
        headers: this.headers(token),
    });
    if (!r.ok) { const err = await r.json(); throw new Error(err.detail); }
    return r.json();
  },

  async deactivateLeadTarget(targetId, token){
    const r = await fetch(`/api/v1/lead-engine/target/${targetId}`, {
        method: "DELETE",
        headers: this.headers(token),
    });
    if (!r.ok) { const err = await r.json(); throw new Error(err.detail); }
    return r.json();
  },
  async fetchSalesKPIs(token, fromDate, toDate) {
    const r = await fetch(`/api/v1/analytics/sales?from_date=${fromDate}&to_date=${toDate}`, { headers: this.headers(token) });
    if (!r.ok) { const err = await r.json(); throw new Error(err.detail); }
    return r.json();
  },

  async fetchTransportKPIs(token, fromDate, toDate) {
    const r = await fetch(`/api/v1/analytics/transport?from_date=${fromDate}&to_date=${toDate}`, { headers: this.headers(token) });
    if (!r.ok) { const err = await r.json(); throw new Error(err.detail); }
    return r.json();
  },
  async fetchFaqs(token) {
    const r = await fetch("/api/v1/faq/list", { headers: this.headers(token) });
    if (!r.ok) throw new Error("Failed to fetch FAQs.");
    return r.json();
  },

  async askFaqQuestion(payload, token) {
    const r = await fetch("/api/v1/faq/ask", {
      method: "POST",
      headers: this.headers(token),
      body: JSON.stringify(payload),
    });
    if (!r.ok) { const err = await r.json(); throw new Error(err.detail); }
    return r.json();
  },

  async answerFaqQuestion(faqId, payload, token) {
    const r = await fetch(`/api/v1/faq/${faqId}/answer`, {
      method: "PUT",
      headers: this.headers(token),
      body: JSON.stringify(payload),
    });
    if (!r.ok) { const err = await r.json(); throw new Error(err.detail); }
    return r.json();
  },
  async fetchRnDKPIs(token, fromDate, toDate) {
    const r = await fetch(`/api/v1/analytics/rnd?from_date=${fromDate}&to_date=${toDate}`, { headers: this.headers(token) });
    if (!r.ok) { const err = await r.json(); throw new Error(err.detail); }
    return r.json();
  },
  async fetchProductionPulse(token) {
    const r = await fetch("/api/v1/orders/pulse", { headers: this.headers(token) });
    if (!r.ok) { const err = await r.json(); throw new Error(err.detail); }
    return r.json();
  },

  async updateOrderStage(orderId, stage, token) {
    const r = await fetch(`/api/v1/orders/${orderId}/stage`, {
        method: "PATCH",
        headers: this.headers(token),
        body: JSON.stringify({ stage })
    });
    if (!r.ok) { const err = await r.json(); throw new Error(err.detail); }
    return r.json();
  },
  async generateLeadEmail(payload, token) {
    const r = await fetch("/api/v1/lead-engine/generate-email", {
        method: "POST",
        headers: this.headers(token),
        body: JSON.stringify(payload),
    });

    if (!r.ok) {
        const err = await r.json();
        throw new Error(err.detail || "AI Email generation failed.");
    }

    return r.json();
  },
  async fetchGtmAnalytics(token, fromDate, toDate) {
    const r = await fetch(`/api/v1/analytics/gtm-roi?from_date=${fromDate}&to_date=${toDate}`, { headers: this.headers(token) });
    if (!r.ok) throw new Error("Failed to fetch GTM Analytics");
    return r.json();
  },

  async fetchSystemHealth(token, fromDate, toDate) {
    
    const r = await fetch(`/api/v1/analytics/system-health?from_date=${fromDate}&to_date=${toDate}`, { headers: this.headers(token) });
    if (!r.ok) throw new Error("Failed to fetch System Health");
    return r.json();
  },
  
  async fetchProductionKPIs(token, fromDate, toDate) {
    const r = await fetch(`/api/v1/analytics/production?from_date=${fromDate}&to_date=${toDate}`, { headers: this.headers(token) });
    if (!r.ok) { const err = await r.json(); throw new Error(err.detail); }
    return r.json();
  },

  async updateTask(taskId, payload, token) {
    const r = await fetch(`/api/v1/tasks/${taskId}`, { method: "PUT", headers: this.headers(token), body: JSON.stringify(payload) });
    if (!r.ok) { const err = await r.json(); throw new Error(err.detail); }
    return r.json();
  },

  async deleteTask(taskId, token) {
    const r = await fetch(`/api/v1/tasks/${taskId}`, { method: "DELETE", headers: this.headers(token) });
    if (!r.ok) { const err = await r.json(); throw new Error(err.detail); }
    return r.json();
  },

  async addManualActivityLog(orderId, payload, token) {
    const r = await fetch(`/api/v1/dashboard/logs?order_id=${encodeURIComponent(orderId)}`, { method: "POST", headers: this.headers(token), body: JSON.stringify(payload) });
    if (!r.ok) { const err = await r.json(); throw new Error(err.detail); }
    return r.json();
  },

  async deleteActivityLog(logId, token) {
    const r = await fetch(`/api/v1/logs/${logId}`, { method: "DELETE", headers: this.headers(token) });
    if (!r.ok) { const err = await r.json(); throw new Error(err.detail); }
    return r.json();
  },

  async uploadFaqDoc(formData, token){
    const r = await fetch('api/v1/faq/upload-doc', {
      method: "POST",
        headers: {
            Authorization: `Bearer ${token}`,
        },
        body: formData,
    });

    if (!r.ok) {
        const err = await r.json();
        throw new Error(err.detail || "FAQ document upload failed.");
    }

    return r.json();
    
  },
  async downloadPdf(taskId, token){
    const r = await fetch(`/api/v1/tasks/${taskId}/export-pdf`, {
        headers: {Authorization: `Bearer ${token}`,}});
    if (!r.ok) {
        console.error(await r.text());
        return;
    }

    const blob = await r.blob();
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `task_${taskId}_export.zip`;
    document.body.appendChild(a);
    a.click();
    a.remove();

    window.URL.revokeObjectURL(url);
  },
  async approveSnovioStaging(targetId, payload, token) {
    const r = await fetch(`/api/v1/lead-engine/targets/${targetId}/approve-staging`, {
        method: "POST", headers: this.headers(token), body: JSON.stringify(payload)
    });
    if (!r.ok) { const err = await r.json(); throw new Error(err.detail); }
    return r.json();
  },
  async rejectSnovioStaging(targetId, payload, token){
    const r = await fetch(`/api/v1/lead-engine/targets/${targetId}/reject-staging`,{
      method: "POST",
      headers: this.headers(token),
      body: JSON.stringify(payload)
    });

    if (!r.ok){
      const err = await r.json();
      throw new Error(err.detail);
    }

    return r.json();
  },
  updateQuarterlyTarget: async (token, email, targetValue) => {
        const response = await fetch(`/api/v1/analytics/admin/users/${email}/target`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ target: targetValue })
        });
        if (!response.ok) throw new Error("Failed to update target");
        return response.json();
  },
  getMyTarget: async (token) => {
    const response = await fetch("/api/v1/bills/target", {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });

    if (!response.ok) {
        throw new Error("Failed to fetch target");
    }

    return response.json();
  },
  async extractOrderOCR(file, token) {
    const formData = new FormData();
    formData.append("file", file);

    const r = await fetch("/api/v1/orders/ocr", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` }, // Note: Do NOT set Content-Type; the browser handles boundaries for FormData
      body: formData,
    });

    if (!r.ok) {
      const err = await r.json();
      throw new Error(err.detail || "Failed to process document.");
    }
    return r.json();
  },
  async searchOAAutocomplete(query, token) {
    const r = await fetch(`/api/v1/orders/search/oa-autocomplete?q=${encodeURIComponent(query)}`, {
        headers: { "Authorization": `Bearer ${token}` }
    });
    if (!r.ok) throw new Error("Autocomplete search failed");
    return r.json();
  },
  
  async uploadTallyJSON(file, token) {
    const formData = new FormData();
    formData.append("file", file);

    const r = await fetch("/api/v1/tally/upload-json", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` }, // Browser handles multipart boundaries automatically
      body: formData,
    });

    if (!r.ok) {
      const err = await r.json();
      throw new Error(err.detail || "JSON processing failed");
    }
    return r.json();
  },

  /*async fetchIndiaGeoJSON(token){
    const r = await fetch("/api/v1/geo/india", {headers: this.headers(token)});
    if(!r.ok){
      const err = await r.json();
      throw new Error(err.detail || "Issue in fetching india GeoJSON");
    }
    return r.json();
  },*/
  
  async uploadTallyInvoiceJSON(file, token) {
    const formData = new FormData();
    formData.append("file", file);

    const r = await fetch("/api/v1/tally/upload-bills", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` }, // Browser handles multipart boundaries automatically
      body: formData,
    });

    if (!r.ok) {
      const err = await r.json();
      throw new Error(err.detail || "JSON processing failed");
    }
    return r.json();
  },
  async indiaStates(token){
    const r = await fetch("/api/v1/geo/india-shapefile", {
      headers: { Authorization: `Bearer ${token}`}
      }
    );
    if(!r.ok){
      const err = await r.json();
      throw new Error(err.detail || "FAiled to fetch the shapefile");
    }
    
    return r.arrayBuffer();
  },
  async fetchStateSummary(token, fromDate, toDate, items=[]){
    const params = new URLSearchParams({
      from_date: fromDate, 
      to_date: toDate
    });

    items.forEach(item=>params.append("items", item));
    
    const r = await fetch(
          `/api/v1/geo/state-summary?${params}`,
          {
              headers:{
                  Authorization:`Bearer ${token}`
              }
          }
      );

      if(!r.ok){
          const err = await r.json();
          throw new Error(err.detail);
      }

      return await r.json();
  },

  async adjustItemStock(token, payload){
    const r = await fetch(
      "/api/v1/master/items/adjust-stock",
        { method: "POST",
          headers:{
            "Content-Type": "application/json",

            Authorization:`Bearer ${token}`
          },
          body: JSON.stringify(payload)
        }
      );

      if(!r.ok){
          const err = await r.json();
          throw new Error(err.detail);
      }

      return await r.json();
  },
  
  async fetchStockLedger(token){

    const r = await fetch(
      "/api/v1/master/items/stock-ledger",
      {
        headers:{
            Authorization:`Bearer ${token}`
        }
      }
    );

    if(!r.ok){
      const err = await r.json();
      throw new Error(err.detail);
    }

    return await r.json();
  },

  async generateQuote(sessionToken, payload){
    const response = await fetch("/api/v1/quotations/quotation",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${sessionToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }
    );

    if(!response.ok){
      const error = await response.json();
      throw new Error(error.detail);
    }

    return await response.blob();
  },
  async getQuotations (sessionToken){
    const response = await fetch(
        `/api/v1/quotations`,
        {
            method: "GET",
            headers: {
                Authorization: `Bearer ${sessionToken}`,
                "Content-Type": "application/json",
            },
        }
    );

    if (!response.ok) {
        const data = await response.json().catch(() => ({}));

        throw new Error(data.detail || "Unable to fetch quotations.");
    }

    return response.json();
  },

  async getQuotation(sessionToken, quotationId){
    const response = await fetch(
        `/api/v1/quotations/${quotationId}`,
        {
            method: "GET",
            headers: {
                Authorization: `Bearer ${sessionToken}`,
            },
        }
    );

    if (!response.ok) {
        const data = await response.json().catch(() => ({}));

        throw new Error(data.detail || "Unable to fetch quotation.");
    }

    return response.json();
  },
  async updateQuotation  (sessionToken, quotationId, updates){
    const response = await fetch(
        `/api/v1/quotations/${quotationId}`,
        {
            method: "PUT",
            headers: {
                Authorization: `Bearer ${sessionToken}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(updates),
        }
    );

    if (!response.ok) {
        const data = await response.json().catch(() => ({}));

        throw new Error(data.detail || "Unable to update quotation.");
    }

    return response.json();
  },

  async deleteQuotation (sessionToken, quotationId){
    const response = await fetch(
        `/api/v1/quotations/${quotationId}`,
        {
            method: "DELETE",
            headers: {
                Authorization: `Bearer ${sessionToken}`,
            },
        }
    );

    if (!response.ok) {
        const data = await response.json().catch(() => ({}));

        throw new Error(data.detail || "Unable to deactivate quotation.");
    }

    return response.json();
  },
  
  downloadQuotation: async (sessionToken, quotationId) => {
    const response = await fetch(
        `/api/v1/quotations/${quotationId}/download`,
        {
            method: "GET",
            headers: {
                Authorization: `Bearer ${sessionToken}`,
            },
        }
    );

    if (!response.ok) {
        let message = "Unable to download quotation.";

        try {
            const error = await response.json();
            message = error.detail || message;
        } catch {
            // Response wasn't JSON.
        }

        throw new Error(message);
    }

    return await response.blob();
  },

  async claimPendingOrder(sessionToken, oaId) {
    const safeId = encodeURIComponent(oaId);

    const response = await fetch(
        `/api/v1/orders/claim/${safeId}`,
        {
            method: "POST",
            headers: {
                Authorization: `Bearer ${sessionToken}`,
                "Content-Type": "application/json",
            },
        }
    );

    const data = await response.json();

    if (!response.ok) {
        throw new Error(
            data?.detail || "Unable to claim order."
        );
    }

    return data;
  },
  
  async fetchExerciseUsers(sessionToken, role = ""){

    const params = new URLSearchParams();

    if (role?.trim()) {
        params.set("role", role.trim());
    }

    const query = params.toString();

    const response = await fetch(
        `/api/v1/exercises/users${query ? `?${query}` : ""}`,
        {
            headers: {
                Authorization:
                    `Bearer ${sessionToken}`,
            },
        }
    );

    if (!response.ok) {
        const data = await response.json().catch(() => ({}));

        throw new Error(data.detail || "Failed to load ERP users.");
    }

    return response.json();
  },

  async generateExerciseDocument(payload, sessionToken){

    const response = await fetch(
        "/api/v1/exercises/generate",
        {
            method: "POST",

            headers: {
                "Content-Type":
                    "application/json",

                Authorization:
                    `Bearer ${sessionToken}`,
            },

            body: JSON.stringify(payload),
        }
    );

    if (!response.ok) {

        const data = await response.json().catch(() => ({}));

        throw new Error(data.detail || "Failed to generate exercise document.");
    }

    return response.blob();
  },

  async fetchExerciseRoles(sessionToken) {

    const response = await fetch(
        "/api/v1/exercises/roles",
        {
            headers: {
                Authorization:
                    `Bearer ${sessionToken}`,
            },
        }
    );

    if (!response.ok) {

        const data =
            await response.json().catch(() => ({}));

        throw new Error(
            data.detail ||
            "Failed to load exercise roles."
        );
    }

    return response.json();
  },

  async updateQuotationStatus(sessionToken, quotationId, payload) {
    const response = await fetch(
        `/api/v1/quotations/${quotationId}/status`,
        {
            method: "PATCH",

            headers: {
                "Content-Type": "application/json",
                Authorization:
                    `Bearer ${sessionToken}`,
            },

            body: JSON.stringify(payload),
        }
    );

    if (!response.ok) {

        const data =
            await response.json().catch(() => ({}));

        throw new Error(
            data.detail ||
            "Failed to update quotation status."
        );
    }

    return response.json();
  },

  async downloadPendingOrdersExcel(sessionToken, fromDate, toDate){
    const response = await fetch(
        `/api/v1/analytics/production/pending-orders/excel?from_date=${fromDate}&to_date=${toDate}`,
        {
            method: "GET",
            headers: {Authorization: `Bearer ${sessionToken}`,},
        }
    );

    if (!response.ok) {
        let message = "Unable to download pending orders report.";

        try {
            const error = await response.json();
            message = error?.detail || message;
        } catch (e){
          console.log("Error: ", e)
        }

        throw new Error(message);
    }

    return await response.blob();
  },
  
  getProductionSchedules: async (
        sessionToken,
        {
            from,
            to,
            stageCode,
            assignedTeam,
            status,
        } = {}
    ) => {

        const params = new URLSearchParams();

        params.set(
            "from_datetime",
            from
        );

        params.set(
            "to_datetime",
            to
        );

        if (stageCode) {
            params.set(
                "stage_code",
                stageCode
            );
        }

        if (assignedTeam) {
            params.set(
                "assigned_team",
                assignedTeam
            );
        }

        if (status) {
            params.set(
                "status",
                status
            );
        }

        const response = await fetch(
            `/api/v1/production-schedules?${params.toString()}`,
            {
                headers: {
                    Authorization:
                        `Bearer ${sessionToken}`,
                },
            }
        );

        if (!response.ok) {

            const error = await response
                .json()
                .catch(() => ({}));

            throw new Error(
                error.detail ||
                "Failed to load production schedules."
            );
        }

        return response.json();
    },


    createProductionSchedule: async (
        sessionToken,
        payload
    ) => {

        const response = await fetch(
            "/api/v1/production-schedules",
            {
                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json",

                    Authorization:
                        `Bearer ${sessionToken}`,
                },

                body: JSON.stringify(
                    payload
                ),
            }
        );

        if (!response.ok) {

            const error = await response
                .json()
                .catch(() => ({}));

            throw new Error(
                error.detail ||
                "Failed to create production schedule."
            );
        }

        return response.json();
    },


    updateProductionSchedule: async (
        sessionToken,
        scheduleId,
        payload
    ) => {

        const response = await fetch(
            `/api/v1/production-schedules/${scheduleId}`,
            {
                method: "PATCH",

                headers: {
                    "Content-Type":
                        "application/json",

                    Authorization:
                        `Bearer ${sessionToken}`,
                },

                body: JSON.stringify(
                    payload
                ),
            }
        );

        if (!response.ok) {

            const error = await response
                .json()
                .catch(() => ({}));

            throw new Error(
                error.detail ||
                "Failed to update production schedule."
            );
        }

        return response.json();
    },


    deleteProductionSchedule: async (
        sessionToken,
        scheduleId
    ) => {

        const response = await fetch(
            `/api/v1/production-schedules/${scheduleId}`,
            {
                method: "DELETE",

                headers: {
                    Authorization:
                        `Bearer ${sessionToken}`,
                },
            }
        );

        if (!response.ok) {

            const error = await response
                .json()
                .catch(() => ({}));

            throw new Error(
                error.detail ||
                "Failed to delete production schedule."
            );
        }

        return response.json();
    },
  
};

export default API;