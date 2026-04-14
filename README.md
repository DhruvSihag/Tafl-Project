# Pumping Lemma Visualizer

An interactive computational platform designed to visualize and validate the non-regularity of formal languages through the application of the **Pumping Lemma**.

**Live Deployment:** [pumpinglemmavisulaizer.vercel.app](https://pumpinglemmavisulaizer.vercel.app/)

---

### Project Overview
* **Objective:** Bridge the gap between abstract mathematical theorems and practical application.
* **Core Use Case:** Serve as a fundamental tool for proving the non-regularity of formal languages.
* **Target Audience:** Researchers, students, and enthusiasts in the field of Automata Theory and Formal Languages (TAFL).
* **Process:** Identify contradictions required for formal proofs by manipulating string components and pumping lengths ($p$).

### Technical Functionality
* **String Decomposition Engine**
    * Automatically partitions input strings into $s = xyz$ segments.
    * Ensures all partitions adhere to the formal constraints of the lemma.
* **Iterative Pumping Simulator**
    * Integrated slider interface to modify the $i$ parameter for the string $xy^iz$.
    * Provides immediate real-time feedback on string transformation and language membership.
* **Logic Validation System**
    * 3D-transformed checklist panel for real-time monitoring of critical conditions:
        1. $|y| \ge 1$: Verification of non-empty pumped substrings.
        2. $|xy| \le p$: Dynamic monitoring of prefix and first-pump length constraints.
        3. $xy^iz \in L$: Continuous verification of language membership.

### Supported Language Classes
* **Linear Growth:** $L = \{ a^n b^n \mid n \ge 0 \}$
* **Binary Sequences:** $L = \{ 0^n 1 1^n \mid n \ge 0 \}$
* **Complex Unions:** $L = \{ a^n b^m c^k \mid n=m \text{ or } m \le k \}$
* **Symmetric Patterns:** $L = \{ ww^R \mid w \in \{a,b\}^* \}$
* **Polynomial Growth:** $L = \{ a^{n^2} \mid n \ge 0 \}$

### Interface and User Experience
* **Aesthetic Direction**
    * Implements a Vibrant Glassmorphic interface (Aurora) for improved visual clarity.
* **Visual Components**
    * **Bubble Node Representation:** Individual characters rendered as translucent glass spheres.
    * **Kinetic Animations:** Staggered wave-bounce effects to improve visual tracking of string expansion.
* **Dynamic Analytics**
    * Logic blocks providing contextual mathematical justifications for proof outcomes.
    * Visual highlighting of specific property violations during the pumping process.
* **Responsive Layout**
    * Custom horizontal scroll containers to maintain interface integrity during massive string growth.

### Technical Stack
* **Framework:** Next.js 14 (App Router)
* **Styling:** Tailwind CSS (Custom glassmorphism and 3D animations)
* **State Management:** React Hooks (useState, useEffect, useRef)
* **Infrastructure:** Vercel (Deployment)

### Installation
* **Step 1:** Clone the repository
    * `git clone https://github.com/Yashmeet-3000/pumping-lemma-visualizer-TAFL.git`
* **Step 2:** Install dependencies
    * `npm install`
* **Step 3:** Initiate development environment
    * `npm run dev`
* **Step 4:** Access application
    * Navigate to `http://localhost:3000`

### Formal Theorem Reference
> For any regular language $L$, there exists a constant $p$ such that any string $w \in L$ where $|w| \ge p$ can be divided into $w = xyz$ satisfying:
> 1. $|y| \ge 1$
> 2. $|xy| \le p$
> 3. $xy^iz \in L$ for all $i \ge 0$


