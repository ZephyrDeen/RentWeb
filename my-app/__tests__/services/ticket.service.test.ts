import { TicketService } from "@/app/services/ticket.service";
import { ticketRepository } from "@/app/repositories/ticket.repository";
import { prisma } from "@/app/lib/prisma";

// Mock dependencies
jest.mock("@/app/repositories/ticket.repository");
jest.mock("@/app/lib/prisma", () => ({
  prisma: {
    property: {
      findFirst: jest.fn(),
    },
  },
}));

describe("TicketService", () => {
  let ticketService: TicketService;

  beforeEach(() => {
    ticketService = new TicketService();
    jest.clearAllMocks();
  });

  describe("getTicketsByUser", () => {
    it("should return tickets for AGENT role", async () => {
      // Arrange
      const mockTickets = [
        { id: "1", title: "Test Ticket", status: "OPEN" },
      ];
      (ticketRepository.findByAgentId as jest.Mock).mockResolvedValue(mockTickets);

      // Act
      const result = await ticketService.getTicketsByUser("agent-123", "AGENT");

      // Assert
      expect(ticketRepository.findByAgentId).toHaveBeenCalledWith("agent-123");
      expect(result).toEqual(mockTickets);
    });

    it("should return tickets for TENANT role", async () => {
      // Arrange
      const mockProperty = { id: "prop-1" };
      const mockTickets = [
        { id: "1", title: "Test Ticket", status: "OPEN" },
      ];
      (prisma.property.findFirst as jest.Mock).mockResolvedValue(mockProperty);
      (ticketRepository.findByPropertyId as jest.Mock).mockResolvedValue(mockTickets);

      // Act
      const result = await ticketService.getTicketsByUser("tenant-123", "TENANT");

      // Assert
      expect(prisma.property.findFirst).toHaveBeenCalledWith({
        where: { tenantId: "tenant-123" },
      });
      expect(ticketRepository.findByPropertyId).toHaveBeenCalledWith("prop-1");
      expect(result).toEqual(mockTickets);
    });

    it("should return empty array when tenant has no property", async () => {
      // Arrange
      (prisma.property.findFirst as jest.Mock).mockResolvedValue(null);

      // Act
      const result = await ticketService.getTicketsByUser("tenant-123", "TENANT");

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe("createTicket", () => {
    it("should throw error if user is not TENANT", async () => {
      // Act & Assert
      await expect(
        ticketService.createTicket("agent-123", "AGENT", {
          title: "Test",
          description: "Test desc",
        })
      ).rejects.toThrow("Only tenants can create tickets");
    });

    it("should throw error if title or description is missing", async () => {
      // Act & Assert
      await expect(
        ticketService.createTicket("tenant-123", "TENANT", {
          title: "",
          description: "Test desc",
        })
      ).rejects.toThrow("Title and description are required");
    });

    it("should throw error if tenant has no property", async () => {
      // Arrange
      (prisma.property.findFirst as jest.Mock).mockResolvedValue(null);

      // Act & Assert
      await expect(
        ticketService.createTicket("tenant-123", "TENANT", {
          title: "Test",
          description: "Test desc",
        })
      ).rejects.toThrow("You don't have a rented property");
    });

    it("should create ticket successfully", async () => {
      // Arrange
      const mockProperty = { id: "prop-1" };
      const mockTicket = {
        id: "ticket-1",
        title: "Test Ticket",
        description: "Test description",
        isUrgent: false,
        status: "OPEN",
      };
      (prisma.property.findFirst as jest.Mock).mockResolvedValue(mockProperty);
      (ticketRepository.create as jest.Mock).mockResolvedValue(mockTicket);

      // Act
      const result = await ticketService.createTicket("tenant-123", "TENANT", {
        title: "Test Ticket",
        description: "Test description",
        isUrgent: false,
      });

      // Assert
      expect(ticketRepository.create).toHaveBeenCalled();
      expect(result).toEqual(mockTicket);
    });
  });

  describe("updateTicketStatus", () => {
    it("should throw error if user is not AGENT", async () => {
      // Act & Assert
      await expect(
        ticketService.updateTicketStatus("ticket-1", "tenant-123", "TENANT", "IN_PROGRESS")
      ).rejects.toThrow("Only agents can update tickets");
    });

    it("should throw error if ticket not found", async () => {
      // Arrange
      (ticketRepository.findById as jest.Mock).mockResolvedValue(null);

      // Act & Assert
      await expect(
        ticketService.updateTicketStatus("ticket-1", "agent-123", "AGENT", "IN_PROGRESS")
      ).rejects.toThrow("Ticket not found");
    });

    it("should throw error for invalid status", async () => {
      // Arrange
      const mockTicket = {
        id: "ticket-1",
        property: { agentId: "agent-123" },
      };
      (ticketRepository.findById as jest.Mock).mockResolvedValue(mockTicket);

      // Act & Assert
      await expect(
        ticketService.updateTicketStatus("ticket-1", "agent-123", "AGENT", "INVALID")
      ).rejects.toThrow("Invalid status");
    });

    it("should update ticket status successfully", async () => {
      // Arrange
      const mockTicket = {
        id: "ticket-1",
        property: { agentId: "agent-123" },
      };
      const updatedTicket = { ...mockTicket, status: "IN_PROGRESS" };
      (ticketRepository.findById as jest.Mock).mockResolvedValue(mockTicket);
      (ticketRepository.update as jest.Mock).mockResolvedValue(updatedTicket);

      // Act
      const result = await ticketService.updateTicketStatus(
        "ticket-1",
        "agent-123",
        "AGENT",
        "IN_PROGRESS"
      );

      // Assert
      expect(ticketRepository.update).toHaveBeenCalledWith("ticket-1", {
        status: "IN_PROGRESS",
      });
      expect(result.status).toBe("IN_PROGRESS");
    });
  });
});
