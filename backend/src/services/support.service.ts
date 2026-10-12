import { TicketPriority, TicketStatus, NotificationType } from '@prisma/client';
import { prisma } from '../config/database.js';
import { AppError } from '../middleware/error.middleware.js';

export class SupportService {
  /**
   * Create new support ticket
   */
  static async createTicket(
    customerId: string,
    userId: string,
    data: {
      subject: string;
      category: string;
      priority?: TicketPriority;
      message: string;
    }
  ) {
    const ticketNumber = `TICK-${Math.floor(1000 + Math.random() * 9000)}`;

    const ticket = await prisma.supportTicket.create({
      data: {
        ticketNumber,
        customerId,
        subject: data.subject,
        category: data.category,
        priority: data.priority || TicketPriority.MEDIUM,
        status: TicketStatus.OPEN,
        messages: {
          create: {
            senderUserId: userId,
            message: data.message,
            isAdminReply: false,
          },
        },
      },
      include: {
        messages: true,
      },
    });

    return ticket;
  }

  /**
   * Get tickets for customer
   */
  static async getCustomerTickets(customerId: string) {
    return prisma.supportTicket.findMany({
      where: { customerId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          include: {
            sender: {
              select: {
                id: true,
                role: true,
                customer: { select: { fullName: true } },
              },
            },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  /**
   * Get single ticket with full message history
   */
  static async getTicketById(ticketId: string, customerId?: string) {
    const ticket = await prisma.supportTicket.findUnique({
      where: { id: ticketId },
      include: {
        customer: { select: { fullName: true, customerNumber: true } },
        messages: {
          orderBy: { createdAt: 'asc' },
          include: {
            sender: {
              select: {
                id: true,
                role: true,
                customer: { select: { fullName: true } },
              },
            },
          },
        },
      },
    });

    if (!ticket) {
      throw new AppError('Support ticket not found.', 404);
    }

    if (customerId && ticket.customerId !== customerId) {
      throw new AppError('Unauthorized access to support ticket.', 403);
    }

    return ticket;
  }

  /**
   * Add message to ticket
   */
  static async addMessage(
    ticketId: string,
    senderUserId: string,
    message: string,
    isAdmin: boolean,
    customerId?: string
  ) {
    const ticket = await prisma.supportTicket.findUnique({
      where: { id: ticketId },
      include: { customer: { include: { user: true } } },
    });

    if (!ticket) {
      throw new AppError('Support ticket not found.', 404);
    }

    if (!isAdmin && customerId && ticket.customerId !== customerId) {
      throw new AppError('Unauthorized access to support ticket.', 403);
    }

    const newMessage = await prisma.supportMessage.create({
      data: {
        ticketId,
        senderUserId,
        message,
        isAdminReply: isAdmin,
      },
      include: {
        sender: {
          select: {
            id: true,
            role: true,
            customer: { select: { fullName: true } },
          },
        },
      },
    });

    // Update ticket status & timestamps
    const newStatus = isAdmin
      ? ticket.status === TicketStatus.OPEN
        ? TicketStatus.IN_PROGRESS
        : ticket.status
      : ticket.status === TicketStatus.RESOLVED
      ? TicketStatus.IN_PROGRESS
      : ticket.status;

    await prisma.supportTicket.update({
      where: { id: ticketId },
      data: {
        status: newStatus,
        updatedAt: new Date(),
      },
    });

    // Notify user if admin replied
    if (isAdmin) {
      await prisma.notification.create({
        data: {
          userId: ticket.customer.userId,
          title: 'Support Ticket Update',
          message: `You have received a reply on support ticket ${ticket.ticketNumber}.`,
          type: NotificationType.INFO,
          link: `/support`,
        },
      });
    }

    return newMessage;
  }

  /**
   * Submit public contact enquiry
   */
  static async submitContactEnquiry(data: {
    name: string;
    email: string;
    subject: string;
    message: string;
  }) {
    return prisma.contactEnquiry.create({
      data: {
        name: data.name,
        email: data.email.toLowerCase().trim(),
        subject: data.subject,
        message: data.message,
      },
    });
  }
}
