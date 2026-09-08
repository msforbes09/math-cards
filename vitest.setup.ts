import "@testing-library/jest-dom/vitest";
import { installLocalStorageIfBroken } from "./test/support/local-storage-polyfill";

installLocalStorageIfBroken();
