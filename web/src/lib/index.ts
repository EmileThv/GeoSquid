// place files you want to import through the `#lib` alias in this folder.
import type { RouteId } from '$app/types';

/** Pages you can link to without parameters ("/learn", not "/learn/[unit]") */
export type StaticRoute = Exclude<RouteId, `${string}[${string}`>;
