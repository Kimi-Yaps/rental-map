describe('My First Test', () => {
  it('Visits the app root url', () => {
    cy.visit('/')
    cy.contains('#container', 'Ready to create an app?')
  })
})

describe('My First Test', () => {
  it('Visits the app root url', () => {
    cy.visit('/')
    cy.contains('#container', 'Ready to create an app?')
  })
})

describe('Infinite Scroll Style Test', () => {
  it('should have the correct styles for infinite-scroll item and content', () => {
    cy.visit('/');
    cy.get('ion-item.infinite-scroll').should('exist').and('be.visible');
    cy.get('ion-item.infinite-scroll').should('have.css', 'display', 'block');
    cy.get('ion-item.infinite-scroll').should('have.css', 'overflow', 'hidden');

    cy.get('ion-item.infinite-scroll .scroll-content').should('exist').and('be.visible');
    cy.get('ion-item.infinite-scroll .scroll-content').should('have.css', 'display', 'flex');
    cy.get('ion-item.infinite-scroll .scroll-content').should('have.css', 'animation-name', 'scroll');
  });
});