"use client";

import React, { useEffect, useRef } from "react";
import { ThreeHexMap, ThreeHexMapOptions } from "@/components/three-hexmap";

export interface ThreeHexMapComponentProps extends ThreeHexMapOptions {
  // 这里可以扩展或覆盖 ThreeHexMap 的配置项
  style?: React.CSSProperties;
  className?: string;
}

const ThreeHexMapComponent: React.FC<ThreeHexMapComponentProps> = ({
  style,
  className,
  ...mapOptions
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      // 实例化时确保 container 使用当前的 div
      const hexMap = new ThreeHexMap({
        ...mapOptions,
        container: containerRef.current,
      });
      
      // 如果需要，可在此返回清理函数（例如 dispose 掉 renderer 等）
      return () => {
        // 清理代码，例如：hexMap.dispose();
      };
    }
  }, [mapOptions]);

  // 设定好容器 div 样式，确保 Three.js 渲染区域覆盖父组件
  return <div ref={containerRef} style={{ width: "100%", height: "100%", ...style }} className={className} />;
};

export default ThreeHexMapComponent;
