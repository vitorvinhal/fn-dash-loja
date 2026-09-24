"use client";

// Push Notification Service
// Uses browser Notification API for local notifications
// For full push, a backend server with VAPID keys would be needed

export interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: Record<string, unknown>;
}

class PushNotificationService {
  private permission: NotificationPermission = "default";

  async requestPermission(): Promise<NotificationPermission> {
    if (!("Notification" in window)) {
      console.warn("Notifications not supported");
      return "denied";
    }

    this.permission = await Notification.requestPermission();
    return this.permission;
  }

  getPermission(): NotificationPermission {
    if (!("Notification" in window)) return "denied";
    return Notification.permission;
  }

  async send(payload: NotificationPayload): Promise<boolean> {
    if (!("Notification" in window)) return false;

    if (this.permission !== "granted") {
      const result = await this.requestPermission();
      if (result !== "granted") return false;
    }

    try {
      new Notification(payload.title, {
        body: payload.body,
        icon: payload.icon || "/favicon.png",
        badge: payload.badge || "/favicon.png",
        tag: payload.tag,
        data: payload.data,
      });
      return true;
    } catch (e) {
      console.error("Notification failed:", e);
      return false;
    }
  }

  // Stock alert notification
  async notifyLowStock(productName: string, currentStock: number): Promise<boolean> {
    return this.send({
      title: "Estoque Baixo",
      body: `${productName} está com apenas ${currentStock} unidades!`,
      tag: `stock-${productName}`,
    });
  }

  // Sale notification
  async notifyNewSale(productName: string, amount: number): Promise<boolean> {
    const formatted = new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(amount);

    return this.send({
      title: "Nova Venda",
      body: `${productName} - ${formatted}`,
      tag: "new-sale",
    });
  }

  // Report notification
  async notifyReport(week: string): Promise<boolean> {
    return this.send({
      title: "Relatório Semanal",
      body: `Relatório da semana de ${week} disponível`,
      tag: "weekly-report",
    });
  }
}

export const pushNotifications = new PushNotificationService();
