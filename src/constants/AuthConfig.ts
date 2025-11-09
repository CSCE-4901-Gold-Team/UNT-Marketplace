export const ALLOWED_EMAIL_DOMAINS = ["my.unt.edu"]; // Add your allowed domains here

export const getDomainRestrictionMessage = () => {
    if (ALLOWED_EMAIL_DOMAINS.length === 1) {
        return `Only ${ALLOWED_EMAIL_DOMAINS[0]} email addresses are allowed`;
    }
    const lastDomain = ALLOWED_EMAIL_DOMAINS[ALLOWED_EMAIL_DOMAINS.length - 1];
    const otherDomains = ALLOWED_EMAIL_DOMAINS.slice(0, -1).join(", ");
    return `Only ${otherDomains} or ${lastDomain} email addresses are allowed`;
};