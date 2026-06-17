
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
    const r = await fetch("/api/v1/orders/master/companies", {
      headers: this.headers(token),
    });

    return r.json();
  },

  async saveCompanyMaster(payload, token) {
    const r = await fetch("/api/v1/orders/master/companies/create", {
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

  async fetchTasks(token) {
    const r = await fetch("/api/v1/tasks", {
      headers: this.headers(token),
    });

    if (!r.ok) {
      throw new Error("Failed to download tasks.");
    }

    return r.json();
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
    const r = await fetch("/api/v1/tasks/create", {
      method: "POST",
      headers: this.headers(token),
      body: JSON.stringify(payload),
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
  
};

export default API;