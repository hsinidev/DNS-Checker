import { GoogleGenAI } from "@google/genai";

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

document.addEventListener('DOMContentLoaded', () => {
    const lookupBtn = document.getElementById('lookupBtn') as HTMLButtonElement;
    const domainInput = document.getElementById('domainInput') as HTMLInputElement;
    const resultsDiv = document.getElementById('results') as HTMLDivElement;
    const btnText = document.getElementById('btnText') as HTMLSpanElement;
    // Fix: Cast to unknown first when casting to SVGElement to resolve TypeScript error.
    const btnSpinner = document.getElementById('btnSpinner') as unknown as SVGElement;

    if (!lookupBtn || !domainInput || !resultsDiv || !btnText || !btnSpinner) {
        console.error('One or more required DOM elements are missing.');
        return;
    }

    const handleLookup = async () => {
        const domain = domainInput.value.trim();
        if (!domain) {
            resultsDiv.innerHTML = `<p class="text-red-400">Please enter a domain name.</p>`;
            return;
        }

        // UI updates for loading state
        lookupBtn.disabled = true;
        btnText.classList.add('hidden');
        btnSpinner.classList.remove('hidden');
        resultsDiv.innerHTML = `<p class="text-gray-400">Resolving IP...</p>`;

        try {
            const prompt = `What is the primary IPv4 address for the domain "${domain}"? Please provide only the IP address and nothing else. If you cannot find it, just say "Unable to resolve".`;
            
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
            });

            const ipAddress = response.text.trim();

            const ipRegex = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/;
            if (ipRegex.test(ipAddress)) {
                 resultsDiv.innerHTML = `
                    <div class="animate-fade-in">
                        <p class="text-gray-300">The IP address for <strong class="text-white">${domain}</strong> is:</p>
                        <p class="text-2xl font-mono text-gold mt-2 tracking-wider">${ipAddress}</p>
                    </div>
                 `;
            } else {
                 resultsDiv.innerHTML = `<p class="text-yellow-400 animate-fade-in">Could not resolve an IP address for <strong class="text-white">${domain}</strong>. Please check the domain and try again.</p>`;
            }

        } catch (error) {
            console.error("Error fetching IP address:", error);
            resultsDiv.innerHTML = `<p class="text-red-400 animate-fade-in">An error occurred while fetching the IP address. Please try again later.</p>`;
        } finally {
            // Restore button state
            lookupBtn.disabled = false;
            btnText.classList.remove('hidden');
            btnSpinner.classList.add('hidden');
        }
    };

    lookupBtn.addEventListener('click', handleLookup);
    domainInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            handleLookup();
        }
    });
});
