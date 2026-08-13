/**
 * Math utilities used throughout the game.
 */

export function clamp(value, min, max)
{
    return Math.max(min, Math.min(max, value))
}

export function lerp(a, b, t)
{
    return a + (b - a) * t
}

export function remap(value, inMin, inMax, outMin, outMax)
{
    return outMin + (value - inMin) / (inMax - inMin) * (outMax - outMin)
}

export function remapClamp(value, inMin, inMax, outMin, outMax)
{
    return clamp(remap(value, inMin, inMax, outMin, outMax), Math.min(outMin, outMax), Math.max(outMin, outMax))
}

export function smoothstep(edge0, edge1, x)
{
    const t = clamp((x - edge0) / (edge1 - edge0), 0, 1)
    return t * t * (3 - 2 * t)
}

export function smallestAngle(from, to)
{
    let diff = to - from
    while(diff > Math.PI) diff -= Math.PI * 2
    while(diff < -Math.PI) diff += Math.PI * 2
    return diff
}
