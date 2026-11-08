# Landing hero photo enhancement

- Method: built-in Imagegen image edit, using `public/doctor-portrait.jpg` as the sole edit reference.
- Selected asset: `public/doctor-portrait-enhanced.png`, copied unchanged from the generated output.
- Original retained: `public/doctor-portrait.jpg`.
- Usage: landing hero in `src/app/page.tsx`, served through Next.js Image with responsive sizes and quality 90.
- This is AI-assisted photographic enhancement, not recovery of verified original sensor detail.

## Exact prompt

Use case: identity-preserve. Edit target: the supplied existing photograph of the doctor holding a flower bouquet. Task: a conservative, extremely natural high-resolution photographic restoration/upscale for a large website hero. Produce a high-resolution portrait output, ideally 2160 x 2720 or greater while retaining the original framing/aspect ratio. Keep EXACTLY the same man's identity, facial geometry, eyes looking downward, expression, hairstyle, hairline, beard, age, skin tone, body, hands, fingers, navy scrubs, watch and ring, pose, bouquet arrangement, camera perspective and clinic background. Recover subtle realistic detail in hair, beard, fabric and flowers; gently reduce JPEG compression and softness, maintain real skin texture and the original softly focused background. No beautification, no waxy skin, no invented pores, no aggressive sharpening, no halos, no cinematic regrading, no change in exposure or saturation, no changing facial proportions. Remove ONLY the black Instagram '1/2' badge at the upper-right and the thin black screenshot edge bars, naturally continuing the same underlying background. Keep background certificates softly blurred without adding or changing readable credentials. Do not redesign the scene, do not recrop, do not add text, logos, people, objects or details not supported by the reference. The outcome should look like a cleaner high-resolution original photograph, not an AI-generated portrait.

