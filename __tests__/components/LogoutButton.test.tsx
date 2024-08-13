import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { useRouter } from "next/router";
import LogoutButton from "@/components/LogoutButton";
import { useAuth } from "../../context/AuthContext";

// Mock the modules
jest.mock("next/router", () => ({
  useRouter: jest.fn(),
}));
jest.mock("../../context/AuthContext", () => ({
  useAuth: jest.fn(),
}));

describe("LogoutButton", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders correctly and calls logout function when clicked", async () => {
    const mockLogout = jest.fn().mockResolvedValue(undefined);
    const mockPush = jest.fn();

    (useAuth as jest.Mock).mockReturnValue({ logout: mockLogout });
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });

    render(<LogoutButton />);

    const button = screen.getByRole("button", { name: /logout/i });
    expect(button).toBeInTheDocument();

    fireEvent.click(button);

    await waitFor(() => {
      expect(mockLogout).toHaveBeenCalledTimes(1);
      expect(mockPush).toHaveBeenCalledWith("/login");
    });
  });

  it("handles logout failure", async () => {
    const mockLogout = jest.fn().mockRejectedValue(new Error("Logout failed"));
    const mockPush = jest.fn();
    const consoleSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    (useAuth as jest.Mock).mockReturnValue({ logout: mockLogout });
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });

    render(<LogoutButton />);

    const button = screen.getByRole("button", { name: /logout/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(mockLogout).toHaveBeenCalledTimes(1);
      expect(consoleSpy).toHaveBeenCalledWith(
        "Logout failed:",
        expect.any(Error)
      );
      expect(mockPush).not.toHaveBeenCalled();
    });

    consoleSpy.mockRestore();
  });
});
