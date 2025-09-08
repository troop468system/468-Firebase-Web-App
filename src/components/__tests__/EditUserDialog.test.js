/**
 * Tests for EditUserDialog Component
 * Tests the standalone edit user dialog functionality
 */

import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithProviders } from '../../../testing/testUtils';
import EditUserDialog from '../EditUserDialog';

// Mock Firebase
jest.mock('../../firebase', () => ({
  auth: {},
  db: {}
}));

// Mock authService
jest.mock('../../services/authService', () => ({
  updateUserProfile: jest.fn()
}));

// Mock user data for testing
const mockScout = {
  id: 'scout1',
  firstName: 'Carter',
  lastName: 'Chang',
  displayName: 'Carter Chang',
  email: 'carter@example.com',
  phone: '4083455888',
  dob: '2011-11-10',
  address: '123 Main St',
  city: 'San Jose',
  state: 'CA',
  zipCode: '95123',
  patrol: 'Dragons',
  rank: 'First Class',
  roles: ['scout'],
  accessStatus: 'approved',
  scoutingStatus: 'Registered'
};

const mockParent = {
  id: 'parent1',
  firstName: 'John',
  lastName: 'Chang',
  displayName: 'John Chang',
  email: 'john@example.com',
  phone: '4081234567',
  roles: ['parent'],
  relation: 'father',
  accessStatus: 'approved'
};

describe('EditUserDialog Component', () => {
  const defaultProps = {
    open: true,
    onClose: jest.fn(),
    onSave: jest.fn(),
    onDelete: jest.fn(),
    loading: false
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Dialog Rendering', () => {
    it('should render when open is true', () => {
      renderWithProviders(
        <EditUserDialog {...defaultProps} user={mockScout} />
      );

      expect(screen.getByText('Scout Information')).toBeInTheDocument();
    });

    it('should not render when open is false', () => {
      renderWithProviders(
        <EditUserDialog {...defaultProps} open={false} user={mockScout} />
      );

      expect(screen.queryByText('Scout Information')).not.toBeInTheDocument();
    });

    it('should show correct title for scout', () => {
      renderWithProviders(
        <EditUserDialog {...defaultProps} user={mockScout} />
      );

      expect(screen.getByText('Scout Information')).toBeInTheDocument();
    });

    it('should show correct title for parent', () => {
      renderWithProviders(
        <EditUserDialog {...defaultProps} user={mockParent} />
      );

      expect(screen.getByText('Father Information')).toBeInTheDocument();
    });

    it('should show generic title for other users', () => {
      const genericUser = { ...mockScout, roles: ['user'] };
      renderWithProviders(
        <EditUserDialog {...defaultProps} user={genericUser} />
      );

      expect(screen.getByText('User Information')).toBeInTheDocument();
    });
  });

  describe('Form Fields', () => {
    it('should populate form fields with user data', () => {
      renderWithProviders(
        <EditUserDialog {...defaultProps} user={mockScout} />
      );

      // Check that form fields are populated (look for values in inputs)
      expect(screen.getByDisplayValue('Carter')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Chang')).toBeInTheDocument();
      expect(screen.getByDisplayValue('carter@example.com')).toBeInTheDocument();
    });

    it('should handle empty/undefined user data', () => {
      const emptyUser = {
        id: 'empty1',
        roles: ['scout']
      };

      renderWithProviders(
        <EditUserDialog {...defaultProps} user={emptyUser} />
      );

      // Should render without crashing
      expect(screen.getByText('Scout Information')).toBeInTheDocument();
    });

    it('should allow editing form fields', () => {
      renderWithProviders(
        <EditUserDialog {...defaultProps} user={mockScout} />
      );

      const firstNameField = screen.getByDisplayValue('Carter');
      fireEvent.change(firstNameField, { target: { value: 'Carter Jr' } });

      expect(screen.getByDisplayValue('Carter Jr')).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('should validate required fields', async () => {
      const onSave = jest.fn();
      renderWithProviders(
        <EditUserDialog {...defaultProps} onSave={onSave} user={mockScout} />
      );

      // Clear required fields
      const firstNameField = screen.getByDisplayValue('Carter');
      fireEvent.change(firstNameField, { target: { value: '' } });

      const lastNameField = screen.getByDisplayValue('Chang');
      fireEvent.change(lastNameField, { target: { value: '' } });

      const emailField = screen.getByDisplayValue('carter@example.com');
      fireEvent.change(emailField, { target: { value: '' } });

      // Try to save
      const saveButton = screen.getByText('Save Changes');
      fireEvent.click(saveButton);

      // Should not call onSave due to validation errors
      expect(onSave).not.toHaveBeenCalled();
    });

    it('should validate email format', async () => {
      const onSave = jest.fn();
      renderWithProviders(
        <EditUserDialog {...defaultProps} onSave={onSave} user={mockScout} />
      );

      // Set invalid email
      const emailField = screen.getByDisplayValue('carter@example.com');
      fireEvent.change(emailField, { target: { value: 'invalid-email' } });

      // Try to save
      const saveButton = screen.getByText('Save Changes');
      fireEvent.click(saveButton);

      // Should not call onSave due to validation error
      expect(onSave).not.toHaveBeenCalled();
    });

    it('should save when all required fields are valid', async () => {
      const onSave = jest.fn();
      renderWithProviders(
        <EditUserDialog {...defaultProps} onSave={onSave} user={mockScout} />
      );

      // Modify a field
      const firstNameField = screen.getByDisplayValue('Carter');
      fireEvent.change(firstNameField, { target: { value: 'Carter Jr' } });

      // Save
      const saveButton = screen.getByText('Save Changes');
      fireEvent.click(saveButton);

      // Should call onSave with updated data
      await waitFor(() => {
        expect(onSave).toHaveBeenCalled();
      });
    });
  });

  describe('Dialog Actions', () => {
    it('should call onClose when Cancel is clicked', () => {
      const onClose = jest.fn();
      renderWithProviders(
        <EditUserDialog {...defaultProps} onClose={onClose} user={mockScout} />
      );

      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);

      expect(onClose).toHaveBeenCalled();
    });

    it('should call onSave when Save Changes is clicked with valid data', () => {
      const onSave = jest.fn();
      renderWithProviders(
        <EditUserDialog {...defaultProps} onSave={onSave} user={mockScout} />
      );

      const saveButton = screen.getByText('Save Changes');
      fireEvent.click(saveButton);

      expect(onSave).toHaveBeenCalled();
    });

    it('should show Delete button for existing users when onDelete is provided', () => {
      renderWithProviders(
        <EditUserDialog {...defaultProps} user={mockScout} />
      );

      expect(screen.getByText('Delete User')).toBeInTheDocument();
    });

    it('should not show Delete button when onDelete is not provided', () => {
      renderWithProviders(
        <EditUserDialog {...defaultProps} onDelete={null} user={mockScout} />
      );

      expect(screen.queryByText('Delete User')).not.toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('should disable buttons when loading', () => {
      renderWithProviders(
        <EditUserDialog {...defaultProps} loading={true} user={mockScout} />
      );

      const saveButton = screen.getByText('Save Changes');
      const cancelButton = screen.getByText('Cancel');

      expect(saveButton).toBeDisabled();
      expect(cancelButton).toBeDisabled();
    });

    it('should show loading state in delete button', () => {
      renderWithProviders(
        <EditUserDialog {...defaultProps} loading={true} user={mockScout} />
      );

      const deleteButton = screen.getByText('Delete User');
      expect(deleteButton).toBeDisabled();
    });
  });

  describe('Role-based Display', () => {
    it('should show scout information for scouts', () => {
      renderWithProviders(
        <EditUserDialog {...defaultProps} user={mockScout} />
      );

      expect(screen.getByText('Scout Information')).toBeInTheDocument();
    });

    it('should show parent information for parents', () => {
      renderWithProviders(
        <EditUserDialog {...defaultProps} user={mockParent} />
      );

      expect(screen.getByText('Father Information')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper dialog structure', () => {
      renderWithProviders(
        <EditUserDialog {...defaultProps} user={mockScout} />
      );

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Edit Scout Information')).toBeInTheDocument();
    });

    it('should support keyboard navigation', () => {
      renderWithProviders(
        <EditUserDialog {...defaultProps} user={mockScout} />
      );

      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();
      
      // Check that the dialog is focusable
      expect(dialog.getAttribute('tabindex')).not.toBe('-1');
    });
  });

  describe('Error Handling', () => {
    it('should handle missing user gracefully', () => {
      renderWithProviders(
        <EditUserDialog {...defaultProps} user={null} />
      );

      // Should render without crashing
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('should handle user without roles', () => {
      const userWithoutRoles = {
        id: 'test1',
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com'
      };

      renderWithProviders(
        <EditUserDialog {...defaultProps} user={userWithoutRoles} />
      );

      expect(screen.getByText('User Information')).toBeInTheDocument();
    });
  });
});