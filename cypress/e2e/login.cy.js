describe('Login Page', () => {
    beforeEach(() => {
        cy.visit('/login');
    });

    it('displays the login form', () => {
        cy.get('input[name="email"]').should('exist');
        cy.get('input[name="password"]').should('exist');
        cy.get('button[type="submit"]').should('contain', 'Login');
    });

    it('shows an error message for invalid credentials', () => {
        cy.get('input[name="email"]').type('invalid@example.com');
        cy.get('input[name="password"]').type('wrongpassword');
        cy.get('button[type="submit"]').click();

        cy.get('.MuiAlert-message').should('contain', 'Invalid email or password');
    });
});